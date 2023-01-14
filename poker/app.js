const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const { setTimeout } = require('timers/promises');
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

io.on('connection', socket =>{
    console.log('new user connected');

    socket.emit('ask username');
    console.log('ask for user name');

    io.game = new Game();

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
            ee.emit('end game');
            //!ee.emit('start round');
            //ee.emit('game ready', game);
        }
    })

    socket.on('made bet', (selectedTokenValues, sum, player) =>{
        //update current token value on common token table
        io.game.commonTokenValues = io.game.commonTokenValues.concat(selectedTokenValues);
        // update highest bet value
        io.game.highestBet = Math.max(io.game.highestBet, sum)
        console.log('user made a bet', sum);
        console.log('highest bet now', io.game.highestBet);
        // add tokens to common table, emit to all other players
        socket.broadcast.emit('receive bet', selectedTokenValues);

        // update bet.value, money, tokens for this player
        let serverPlayer = io.game.players[io.game.CurrentPlayer];
        serverPlayer.money = player.money;
        serverPlayer.betValue = player.betValue;
        serverPlayer.tokens = player.tokens;
        console.log('current player is now ', io.game.players[io.game.CurrentPlayer]);

        // then proceed to next player
        io.game.CurrentPlayer += 1;
        console.log('bet, current player is updated to ', io.game.CurrentPlayer);
        ee.emit('start turn');
    })

    socket.on('made fold', ()=>{
        // set folded status to true
        io.game.players[io.game.CurrentPlayer].folded = true;
        // proceed to next player
        console.log('fold, current player is updated to ', io.game.CurrentPlayer);
        io.game.CurrentPlayer += 1;
        ee.emit('start turn');

    })
})

class Game {
    constructor(){
        this.winner = null;
        this.foldedCount = 0;
        this.cycle = 1;
        this.round = 0;
        this.highestBet = 0;
        this.commonTokenValues = [];

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
        // clear all cards
        io.emit('reset game');
        this.commonCards.forEach(card=>card.removeCard());
        this.players.forEach(player=>{
            player.cards.forEach(card => card.removeCard());
        })
        // set up new game
        this.setupCards();
        // reset game status;
        this.winner = null;
        this.foldedCount = 0;
        this.cycle = 1;
        this.highestBet = 0;
        this.commonTokenValues = []; // already reset in 'compute tokens'
        // rotate players;
        let firstPlayer = this.players.shift();
        this.players.push(firstPlayer);
        this.CurrentPlayer = 0;
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


    // After computing for winner, set game.winner = winners array and write eval msg
    returnEvalMsg(){
        // Write handNames of each player (only for debug purpose)
        let evalMsg = '';
        for(const player of this.players){
            this.evaluateHand(player, this.commonCards.concat(player.cards)); 
            evalMsg += `Player ${player.username}: ${player.handName}; `
        }
        console.log('eval msg after evaluate hand', evalMsg);
        let [winners, needHighCard] = this.evaluateWinner();

        // Write winner name
        if (winners.length > 1){
            var winnerName = "tie between";
            winners.forEach(winner=> winnerName = winnerName+ ' ' + winner.username + ' ');
        } else {
            var winnerName = winners[0].username;
        }
        evalMsg += "\n Winner is " + winnerName;
        console.log('eval msg after evaluate winner', evalMsg);

        // Write whether high cards were used to evaluate (for debug purposes)
        if (needHighCard){
            evalMsg += " after comparing highest cards"
        }
        this.winners = winners;
        return evalMsg;
    }

    // Set player.hand and player.handName
    evaluateHand(player, cardsGiven){
        console.log('running evaluate hand')
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
            player.handRank = 9;
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
        console.log('running evaluate winner')
        // Return [winners, highCard]
        // needHighCard=true if winner rank name are the same and need to compare high cards
        // winner=null if both players have same cards
    
        var needHighCard = false;
        const allRanks = this.players.map(player=>player.handRank);
        const maxRank = Math.max.apply(null, allRanks);
        var winners = this.players.filter(player=>player.handRank === maxRank); // array of winners
        console.log('winners', winners);
        if (winners.length === 1){
            // If have definitive winner
            return [winners, needHighCard];
        } else {
            // If have multiple winners with same hand
            needHighCard = true;
            winners = this.evaluateHighCards(winners, true);       
            if (winners.length===1){
                // If not more tie, return winner
                return [winners,  needHighCard];
            } else {
                // If still tie, continue to evaluate remaining cards
                winners = this.evaluateHighCards(winners, false);
                return [winners, needHighCard];
            }
        }
    }

    // Helper for evaluateWinner, return array of winners
    //! Currently only works with two tied winners
    evaluateHighCards(winners, evalRank){
        console.log('running evaluate high cards')
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

    //TODO: Need to verify split token works in edge cases
    // Return array of token values for each pile
    splitTokens(tokenValues, pile){
        let sum = tokenValues.reduce((sumValue, tokenValue)=> sumValue+tokenValue,0)
        // round to nearest multiple of pile
        let subSum = Math.floor(sum / pile) - Math.floor(sum / pile)% pile; // for pile = 2 players, ceiling doesn't matter

        let subTokenValues = [];
        while (subSum - Math.sum(subTokenValues) >= 50){
            subTokenValues.push(50);
        }
        while (subSum - Math.sum(subTokenValues) >= 10){
            subTokenValues.push(10);
        }
        while (subSum - Math.sum(subTokenValues) >= 5){
            subTokenValues.push(5);
        }

        return subTokenValues;
    }
}

/* ee.on('game ready', (game) => {
    game.setGame(players);
    ee.emit('start round',game);
}) */

ee.on('start round', ()=>{
    // Reset highest bet in current round, first player, and cycle
    io.game.highestBet = 0;
    io.game.CurrentPlayer = 0;
    io.game.cycle = 1;
    if (io.game.round === 3){
        console.log('completed all rounds, end game')
        setTimeout(() => {
            ee.emit('end game');
        }, 2000);
    } else {
        ee.emit('start turn');
    }
    
})

ee.on('start turn', ()=>{
    console.log('new turn initiated')
    var isFirstPlayer = false;
    // Figure out whose turn to play
    if (io.game.CurrentPlayer === 0){
        isFirstPlayer = true;
    } else if (io.game.CurrentPlayer === io.game.playerCount){
        console.log('all players have played')
        // All players have played, i.e. current player incremented over by 1
        let allMatch = io.game.players.map(player=>player.betValue).filter(value => value === io.game.highestBet).length === io.game.playerCount;
        if (io.game.cycle ===1 && !allMatch){
            console.log('start second cycle')
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
        ee.emit('end game early');
    } else if (io.game.CurrentPlayer === null){
        // If all players have played, start next round
        console.log('proceed to next round')
        ee.emit('next round');
    } else {
        let player = io.game.players[io.game.CurrentPlayer];
        console.log('current io.game cycle and currentplayer', io.game.cycle, io.game.CurrentPlayer);
        console.log('current player is', player);
        if (player.folded){
            // If folded, proceed to next player
            io.game.CurrentPlayer += 1;
            console.log('proceed to next turn')
            ee.emit('start turn');
        } else if (io.game.cycle===2 && player.betValue === io.game.highestBet) {
            // If not folded, but at cycle 2 and already at highest bet, proceed to next player
            console.log('skip player in cycle 2')
            io.game.CurrentPlayer += 1;
            console.log('proceed to next turn')
            ee.emit('start turn');
        } else {
            // If not folded, take action
            console.log('current player acts')
            let socketid = player.socketid;
            io.to(socketid).emit('play', io.game, isFirstPlayer); // one player plays
            io.sockets.sockets.get(socketid).broadcast.emit('watch', player) // other players watch
        }
    }
    
})

ee.on('next round',()=>{
    console.log('next round initiated')
    io.emit('flip common cards'); // decide which cards to flip on client side
    io.game.round ++; // increment round
    console.log(io.game.round)
    ee.emit('start round');
})

ee.on('end game',()=>{
    console.log('Running end game')
    // Reveal hand and winner, send to all users
    let evalMsg = io.game.returnEvalMsg();
    console.log('final eval msg', evalMsg)
    io.emit('display evalMsg', evalMsg);
    
    //? Future fix: Make compute tokens start after all users clicked confirm on alert popup window
    setTimeout(() => {
        ee.emit('compute tokens');
    }, 2000);
})

ee.on('end game early',()=>{
    var winners = io.game.players.filter(player => !player.folded) // the only player who hasn't folded
    var winnerName = winners[0].username;
    io.game.winner = winners;
    let evalMsg = "Winner is " + winnerName;
    io.emit('display evalMsg', evalMsg);

    //? Future fix: Make compute tokens start after all users clicked confirm on alert popup window
    setTimeout(() => {
        ee.emit('compute tokens');
    }, 2000);
})



ee.on('compute tokens',()=>{
    // Split tokens if needed
    let commonTokenValues = io.game.commonTokenValues;
    if (winners.length === 1){
        var winnerTokenValues = commonTokenValues;
    } else {
        var winnerTokenValues = io.game.splitTokens(commonTokenValues, winners.length);
    }
    // let winner users collect tokens
    let winnersocketids = io.game.winners.forEach(player=>player.socketid);
    for (let winnersocketid of winnersocketids){
        io.to(winnersocketid).emit('collect tokens', winnerTokenValues);
    }
    // clear common table for all users
    io.emit('clear common tokens');
    io.game.commonTokenValues = [];

    console.log('Game has ended!!!')
    setTimeout(()=>{
        io.game.resetGame();
    }, 2000)

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