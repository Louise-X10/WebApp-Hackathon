const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const port = 3000;

// Serve all files
app.use(express.static(__dirname));

// Define default behavior if enter empty path
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

server.listen(port, () => {
  console.log(`listening on *:${port}`);
});

// actual server code
var players = [] // [{socketID, username}, ...]
var EventEmitter = require("events").EventEmitter;
var ee = new EventEmitter();
var game = null;

io.on('connection', socket =>{
    console.log('new user connected');

    socket.emit('ask username');
    console.log('ask for user name');

    io.game = new Game();

    /* socket.emit('ask username');
    console.log('ask for user name'); */

    socket.on('player ready', (player) => {
        console.log('receive player ready');
        player.socketid = socket.id;
        players.push(player);

        // wait until 2 players to start game
        //! Tempororay start condition
        if (players.length < 2){
            socket.emit('waiting');
        } else {
            io.game.setGame(players);
            ee.emit('start round');
            //ee.emit('game ready', game);
        }
    })

    socket.on('made bet', (selectedTokenValues, sum) =>{
        // update highest bet value
        io.game.highestBet = Math.max(io.game.highestBet, sum)
        console.log('user made a bet');
        console.log(io.game.highestBet);
        // add tokens to common table, emit to all other players
        socket.broadcast.emit('receive bet', selectedTokenValues);

        // once player has played, proceed to next player
        io.game.CurrentPlayer += 1;
        ee.emit('start turn');
    })

    socket.on('made fold', ()=>{
        // set folded status to true
        io.game.players[io.game.CurrentPlayer].folded = true;
        // proceed to next player
        io.game.CurrentPlayer += 1;
        ee.emit('start turn');

    })
})

class Game {
    constructor(){
        this.winner = null;
        this.foldedCount = 0;
        this.cycle = 1;
        this.highestBet = 0;

        // Get all defined class methods: only gets public methods
        const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(this));

        // Bind all methods
        methods
            .filter(method => (method !== 'constructor'))
            .forEach((method) => { this[method] = this[method].bind(this); });
    }

    setGame(players){
        this.setPlayers(players);
        this.setupCards();
    }

    // Don't need to reset listeners, need to remove prior cards and generate new cards, remove eval message
    resetGame(){
        this.commonCards.forEach(card=>card.removeCard());
        this.players.forEach(player=>{
            player.cards.forEach(card => card.removeCard());
        })
        this.setupCards();
        this.setupCardInteraction();
        let msg = document.querySelector('#evalMsg');
        msg.textContent = ''
    }

    setPlayers(players){
        this.players = players;
        this.playerCount = players.length;
        this.CurrentPlayer = 0;
    }

    // generate common cards and save for this game
    // generate player cards for each player
    setupCards(){
        const deck = new Deck();
        let card1 = deck.deal();
        let card2 = deck.deal();
        let card3 = deck.deal();
        let card4 = deck.deal();
        let card5 = deck.deal();
        this.commonCards = [card1, card2, card3, card4, card5];
        console.log('common cards generated');
        io.emit('deal common cards', this.commonCards);

        for (let player of this.players){
            let playercard1 = deck.deal();
            let playercard2 = deck.deal();
            let socketid = player.socketid;
            player.cards = [playercard1, playercard2];
            io.to(socketid).emit('deal player cards', [playercard1, playercard2]);
        }
        console.log('player cards generated');
    }


    returnWinner(){
        // Write handNames of each player (only for debug purpose)
        let evalMsg = '';
        for(const player of this.players){
            this.evaluateHand(player, this.commonCards.concat(player.cards)); 
            evalMsg += `Player ${player.username}: ${player.handName}; `
        }
        let [winners, highCard] = this.evaluateWinner(this.players);

        // Write winner name
        if (winners.length > 1){
            var winnerName = "tie between";
            winners.forEach(winner=> winnerName = winnerName+ ' ' + winner.username + ' ');
        } else {
            var winnerName = winners[0].username;
        }
        evalMsg += "\n Winner is " + winnerName;

        // Write whether high cards were used to evaluate (for debug purposes)
        if (highCard){
            evalMsg += " after comparing highest cards"
        }
    }
    
    // Set player.hand and player.handName
    evaluateHand(player, cardsGiven){
        var cards = cardsGiven.map(x=>x); // make copy of given cards
        cards.sort((card1, card2)=> card1[1] - card2[1]); // sort [suit, value] in ascending number order

        let suits = cards.map(c => c[0]);
        let numbers = cards.map(c => c[1]);
        
        let numberFreq = numbers.reduce((acc, curr) => (acc[curr] ? acc[curr]++ : acc[curr] = 1, acc), {}) 
        let numberFreqValues = Object.values(numberFreq);

        let suitFreq = suits.reduce((acc, curr) => (acc[curr] ? acc[curr]++ : acc[curr] = 1, acc), {}) 
        let suitFreqValues = Object.values(suitFreq);

        let isFlush = suitFreqValues.includes(5||6||7); 
        // Check for straight flush
        if (!isFlush){
            var straightFlushCards = [];
        } else {
            let handBool = suits.map((num) => suitFreq[num]>=5);
            let flushCards = cards.filter((value, index)=>handBool[index]);
            var straightFlushCards = this.returnStraight(flushCards);
        }
        let straightCards = this.returnStraight(cards);
        let isStraightFlush = straightFlushCards.length > 0;
        let isStraight = straightCards.length > 0;

        // handCards: list of cards to form a hand
        // handName: name of hand
        // handBool: list of booleans [true, false, ...] used to generate handCards from cards
        if (isStraightFlush){
            var handCards = straightFlushCards;
            var handBool = false;
            var handName = "Straight Flush";
            player.handRank = 1;
        } else if (numberFreqValues.includes(4)){
            var handBool = numbers.map((num) => numberFreq[num]===4);
            var handName = "Four of a kind";
            player.handRank = 2;
        } else if (numberFreqValues.includes(3) && numberFreqValues.includes(2)){
            var handBool = numbers.map((num) => numberFreq[num]===3 || numberFreq[num]===2);
            var handName = "Full House";
            player.handRank = 3;
        } else if (isFlush){
            var handBool = suits.map((num) => suitFreq[num]>=5);
            var handName = "Flush";
            player.handRank = 4;
        } else if (isStraight){
            var handCards = straightCards;
            var handBool = false;
            var handName = "Straight";
            player.handRank = 5;
        } else if (numberFreqValues.includes(3)){
            var handBool = numbers.map((num) => numberFreq[num]===3);
            var handName = "Three of a kind";
            player.handRank = 6;
        } else if (numberFreqValues.includes(2) && numberFreqValues.indexOf(2) !== numberFreqValues.lastIndexOf(2)) {
            var handBool = numbers.map((num) => numberFreq[num]===2);
            var handName = "Two pairs";
            player.handRank = 7;
        } else if (numberFreqValues.includes(2)){
            var handBool = numbers.map((num) => numberFreq[num]===2);
            var handName = "One pair";
            player.handRank = 8;
        } else {
            // if no hand at all, select highest valued cards, i.e. remove two lowest
            cards.shift();
            cards.shift();
            player.handCards = cards;
            player.handName = "None";
            return; 
        }

        // Select hand cards from handBool if not already calculated
        if (handBool !== false){
            var handCards = cards.filter((value, index)=>handBool[index]);
        }
        
        // Select highest cards from remaining cards (ascending order)
        if (handCards.length < 5){
            let remainingCards = cards.filter(card => !handCards.includes(card));
            let remainingLength = 5 - handCards.length;
            player.rankCards = handCards.map(x=>x);
            player.highCards = [];
            while(remainingLength>0){
                let maxCard = remainingCards.pop(); // card with max number is at the end
                handCards.push(maxCard);
                player.highCards.push(maxCard);
                remainingLength--;
            }
        } else {
            // If hand consists of 5 cards (e.g. straight, flush)
            player.rankCards = handCards;
            player.highCards = [];
        }
        
        // handCards.sort((card1, card2)=> card1.number - card2.number); // Sort in ascending order
        player.handCards = handCards;
        player.handName = handName;
    }

    // Only checks for straight, no flush, in given set of cards
    // Returns list of straight cards (ascending order), or [] if none
    // Helper for evaluateHand
    returnStraight(cards){
        // Don't need to check for straight if not enough 5 cards
        if (cards.length < 5){
            return [];
        }

        let numbersCloneDuplicates = cards.map(c => c[1]); // clone numbers array
        let numbersNoDuplicate = new Set(numbersCloneDuplicates);
        let numbersClone = Array.from(numbersNoDuplicate.values()); // with no duplicates

        // ace also counts as a 1
        if (numbersClone.includes(14)){
            numbersClone.unshift(1);
        }

        // Search for range of straight, i.e. continuous numbers
        let startIndex = 0;
        let endIndex = 1;
        while (endIndex < numbersClone.length){
            // if continuous, increment endIndex
            if (numbersClone[endIndex]-numbersClone[endIndex-1] === 1){
                endIndex++;
            // if not continuous but already have at least 5 in straight, break
            } else if (endIndex-startIndex>=5){
                break;
            // if not continuous, reset startIndex and endIndex and keep looking
            } else {
                startIndex = endIndex;
                endIndex = startIndex+1;
            }
        }

        let straightNumbers = numbersClone.slice(startIndex,endIndex);
        // If longer than 5 straight, remove the smaller numbers
        while (straightNumbers.length > 5){
            straightNumbers.shift();
        }
        // If have straight, return straight cards
        if(straightNumbers.length === 5){
            // pick first card with each num
            // if num == 1, convert it to 14 
            if (straightNumbers.includes(1)){
                straightNumbers[0] = 14; // replace first number as 14 in straightNumbers
            }
            let straightCards = straightNumbers.map((num)=> cards[numbersCloneDuplicates.indexOf(num)]);
            return straightCards;
        } else {
            return [];
        }
        
    }

    // Return [winners, highCard], array of winners of current round and whether highcard were used in eval
    evaluateWinner(){
        // Return [winners, highCard]
        // needHighCard=true if winner rank name are the same and need to compare high cards
        // winner=null if both players have same cards
    
        let needHighCard = false;
        const maxRank = Math.max(this.players.map(player=>player.handRank));
        var winners = this.players.filter(player=>player.handRank === maxRank); // array of winners
        if (winners.length === 1){
            // If have definitive winner
            return [winners, needHighCard];
        } else {
            // If have multiple winners with same hand
            needHighCard = true;
            winners = this.evaluateHighCards(winners, evalRank = true);       
            if (winners.length===1){
                // If not more tie, return winner
                return [winners, highCard];
            } else {
                // If still tie, continue to evaluate remaining cards
                winners = this.evaluateHighCards(winners, evalRank = false);
                return [winners, highCard];
            }
        }
    }

    // Helper for evaluateWinner, return array of winners
    //! Currently only works with two tied winners
    evaluateHighCards(winners, evalRank){
        // already sorted in ascending order
        if (evalRank){
            var player1Cards = winners[0].rankCards.map(x=>x);
            var player2Cards = winners[1].rankCards.map(x=>x);
        } else {
            var player1Cards = winners[0].highCards.map(x=>x);
            var player2Cards = winners[1].highCards.map(x=>x);
        }
        
        // Compare list of cards by number until list exhausts
        while(player1Cards.length>0){
            let player1card = player1Cards.pop();
            let player2card = player2Cards.pop();
            if (player1card[1] === player2card[1]){
                continue
            } else if (player1card[1] > player2card[1]){
                return [winners[0]];
            } else if (player1card[1] < player2card[1]){
                return [winners[1]];
            }
        }
        return winners; // tie with completely same cards
    }

    endGame(earlyEnd=false){ 
        if (nextBtn.textContent === 'Collect tokens') {
            // Last step: collect tokens
            let commonTokens = commonTokenTable.querySelectorAll('.token');
            if (this.winner.length === 1){
                commonTokens.forEach((token)=>this.winner[0].collectToken(token));
            } else {
                subTokenSet = splitTokens(commonTokens);
                clearCommonTokens();
                // Add pile of token to each winner player
                this.winner.forEach(winner =>{
                    subTokenSet.forEach((value)=> winner.addToken(value));
                })
            }
            nextBtn.textContent = 'Next Step';
            // initiate new Game;
            resetBtn.addEventListener('click', this.resetGame, {once: true});
        } else if (earlyEnd){
            var winner = players.filter(player => !player.folded)
            var winnerName = winner[0].container.getAttribute('id');
            this.winner = winner;
            let evalMsg = "Winner is " + winnerName;
            nextBtn.textContent = 'Collect tokens';
            let msg = document.querySelector('#evalMsg');
            msg.textContent = evalMsg;
            this.nextStep(); // setup listener but don't start new round
        } else if (nextBtn.textContent === 'Reveal Hand') {
            // If normal end, reveal winner and hands, setup collect tokens
            this.evaluateHand(this.player1, this.commonCards.concat(this.player1.cards)); //*
            this.evaluateHand(this.player2, this.commonCards.concat(this.player2.cards)); //*
            var [winner, highCard] = this.evaluateWinner(this.player1, this.player2);
            if (winner.length > 1){
                var winnerName = "tie between";
                winner.forEach(winner=> winnerName = winnerName+ ' ' + winner.container.getAttribute('id') + ' ');
            } else {
                var winnerName = winner[0].container.getAttribute('id');
            }
            let evalMsg = "Player1: " + this.player1.handName + "; Player2: " + this.player2.handName + "\n Winner is " + winnerName;
            if (highCard){
                evalMsg += " after comparing highest cards"
            }
            this.winner = winner;
            let msg = document.querySelector('#evalMsg');
            msg.textContent = evalMsg;
            nextBtn.textContent = 'Collect tokens';
            this.nextStep(); // setup listener but don't start new round
        } 
    }


    //TODO: Split token in progress
    // Return array of token values for each pile
    splitTokens(tokenSet, pile){
        tokenSet = Array.from(tokenSet); // convert Nodelist to array
        let sum = tokenSet.reduce((sumValue, token)=> sumValue+getTokenValue(token),0)
        // round to nearest multiple of pile
        let subSum = Math.floor(sum / pile) - Math.floor(sum / pile)% pile; // for pile = 2 players, ceiling doesn't matter

        let subTokenSet = [];
        while (subSum - Math.sum(tokenSet1) >= 50){
            subTokenSet.push(50);
        }
        while (subSum - Math.sum(tokenSet1) >= 10){
            subTokenSet.push(10);
        }
        while (subSum - Math.sum(tokenSet1) >= 5){
            subTokenSet.push(5);
        }

        return subTokenSet;
    }
}

/* ee.on('game ready', (game) => {
    game.setGame(players);
    ee.emit('start round',game);
}) */

ee.on('start round', ()=>{
    // Reset highest bet in current round, aand first player
    io.game.highestBet = 0;
    io.game.CurrentPlayer = 0;
    ee.emit('start turn');
})

ee.on('start turn', ()=>{
    var isFirstPlayer = false;
    // Figure out whose turn to play
    if (io.game.CurrentPlayer === 0){
        isFirstPlayer = true;
    } else if (io.game.CurrentPlayer === io.game.playerCount){
        // All players have played
        let allMatch = io.game.players.map(player=>player.betValue).filter(value => value === io.game.highestBet).length === io.game.playerCount;
        if (io.game.cycle ===1 && !allMatch){
            // start cycle 2
            io.game.cycle = 2;
            io.game.CurrentPlayer = 0;
        } else {
            // start next round
            io.game.cycle = 1;
            io.game.CurrentPlayer = null;
        }
    }

    if (io.game.foldedCount === io.game.playerCount-1){
        //TODO end game early
    } else if (io.game.CurrentPlayer === null){
        ee.emit('next round');
    } else {
        let player = io.game.players[io.game.CurrentPlayer];
        if (player.folded){
            // If folded, proceed to next player
            io.game.CurrentPlayer += 1;
            ee.emit('start turn');
        } else if (io.game.cycle===2 && player.betValue === io.game.highestBet) {
            // If not folded, but at cycle 2 and already at highest bet, proceed to next player
            io.game.CurrentPlayer += 1;
            ee.emit('start turn');
        } else {
            // If not folded, take action
            let socketid = player.socketid;
            io.to(socketid).emit('play', io.game, isFirstPlayer); // one player plays
            io.sockets.sockets.get(socketid).broadcast.emit('watch', io.game.CurrentPlayer) // other players watch
        }
    }
    
})

ee.on('next round',()=>{
    if (!io.game.commonCards[0].isFlipped()){
        io.game.commonCards[0].flip();
        io.game.commonCards[1].flip();
        io.game.commonCards[2].flip();
        io.emit('flip common cards', [0,1,2]); // flip common cards on all users
        ee.emit('start round');
    } else if (!io.game.commonCards[3].isFlipped()){
        io.game.commonCards[3].flip();
        io.emit('flip common cards', [3]); // flip common cards on all users
    } else if (!io.game.commonCards[4].isFlipped()){
        io.game.commonCards[4].flip();
        io.emit('flip common cards', [4]); // flip common cards on all users
        setTimeout(()=>{
            // Reveal hand and winner, send to all users
        }, 1000)
        //! Make collect tokens start after all users clicked confirm on alert popup window
        setTimeout(()=>{
            // collect tokens, send to all users
            // end game
        })
    }

})


class Deck {
    constructor(){
        this.deck = [];
        this.reset();
        this.shuffle();
    }

    reset() {
        this.deck = [];
        const suits = ['clubs', 'diamonds','hearts', 'spades'];
        const values = [2, 3, 4, 5, 6, 7, 8, 9, 10, 'jack', 'queen', 'king', 'ace'];
        for (let suit of suits) {
            for (let value of values) {
                this.deck.push([suit, value]);
            }
        }
    }

    shuffle() {
        let totalNumOfCards = this.deck.length;
        for (let i = 0; i < totalNumOfCards; i++){
            let j = Math.floor(Math.random() * totalNumOfCards);
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    }

    deal() {
        const card = this.deck.pop();
        return card;
    }

}

//* Token functions

function getTokenValue(token){
    let val = token.className.split(' ')[1];
    val = val.slice(1,val.length);
    return Number(val);
}

// clear all tokens on common table
function clearCommonTokens(){
    let tokens = document.querySelectorAll(`.common .table.tokens img`);
    for (let token of tokens){
        commonTable.removeChild(token);
    }
}

// sort players so that first player at front
//let game = Game(players);
