const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
//const { setTimeout } = require('timers/promises');
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

//* actual server code
var loggedPlayers = [] // [player {username, socketid, ...}, ...]
var allSockets = [] // [socket {ready=false, player(optional)...}, ...]
var EventEmitter = require("events").EventEmitter;
var ee = new EventEmitter();

io.on('connection', socket =>{
    console.log('new user connected');

    // Keep track of all connected servers, used for checking if received response from all servers
    socket.ready = false;
    allSockets.push(socket);
    console.log(allSockets.map(socket => socket.ready));

    socket.on('disconnect', function() {
        console.log('new user disconnected');
        allSockets = allSockets.filter(listedSocket => listedSocket!==socket); // remove socket from list
        console.log(allSockets.map(socket => socket.ready));
        if (socket.player!==undefined) {
            loggedPlayers = loggedPlayers.filter(player => player!= socket.player); // remove socket player from list of logged players
            io.emit('log all players', loggedPlayers); // update log whenever some player disconnects
        }
    });

    //console.log('print users before asking') - Not working, may have to do with alert
    //io.emit('log all players', loggedPlayers); // update log whenever some player disconnects
    socket.emit('ask username');
    console.log('ask for user name');

    io.game = new Game();

    socket.on('player ready', (player) => {
        console.log('receive player ready');
        player.socketid = socket.id;
        socket.player = player;
        loggedPlayers.push(player);
        io.emit('log all players', loggedPlayers); // update log whenever new player connects

    })

    socket.on('ready to start', ()=>{
        io.game.setGame(loggedPlayers);
        io.emit('start game'); // clear player start button and setup reset button
        ee.emit('start round'); // start game

    })

    socket.on('reset game',()=>{
        console.log('reset game requested')
        io.game.setGame(loggedPlayers);
        io.emit('reset game requested'); // clear player start button and setup reset button
        ee.emit('start round'); // start game
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
        // console.log('current player is now ', io.game.players[io.game.CurrentPlayer]);

        // then proceed to next player
        io.game.CurrentPlayer++;
        console.log('bet, current player is updated to ', io.game.CurrentPlayer);
        ee.emit('start turn');
    })

    socket.once('made fold', ()=>{
        // set folded status to true
        console.log('receive made fold');
        console.log(io.game.players);
        console.log(io.game.CurrentPlayer);
        console.log('folded player', io.game.players[io.game.CurrentPlayer]);
        io.game.players[io.game.CurrentPlayer].folded = true;
        io.game.foldedCount ++;
        // proceed to next player
        io.game.CurrentPlayer ++;
        console.log('fold, current player is updated to ', io.game.CurrentPlayer, 'fold count', io.game.foldedCount);
        ee.emit('start turn');
        console.log('remove fold listener');
    })

    // After all users clicked ready for next game, setup next game
    socket.on('ready for next game',()=>{
        socket.ready = true;
        console.log(allSockets.map(socket => socket.ready));
        let allReady = allSockets.filter(socket => socket.ready === true).length === allSockets.length;
        console.log('one more user ready', allReady)
        if (allReady){
            console.log('calling next game');
            ee.emit('next game');
        }
    })
})

//* Internal events

ee.on('start round', ()=>{
    // Reset highest bet in current round, first player, and cycle
    io.game.highestBet = 0;
    io.game.CurrentPlayer = 0;
    io.game.cycle = 1;
    if (io.game.round === 3){
        io.game.round = 0;
        console.log('completed all rounds, end game')
        ee.emit('end game');
    } else {
        ee.emit('start turn');
    }
})

ee.on('start turn', ()=>{
    console.log('new turn initiated')

    if (io.game.foldedCount === io.game.playerCount-1){
        console.log('all else folded, end game early')
        io.game.round = 3;
        ee.emit('start round');
        return;
    }

    var isFirstPlayer = false;
    // Decide whether we have reached edge cases, i.e. all players player, or should proceed to next round
    if (io.game.CurrentPlayer === 0){
        isFirstPlayer = true;
    } else if (io.game.CurrentPlayer === io.game.playerCount){
        // All players have played, i.e. current player incremented over by 1
        console.log('all players have played')
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

    // Act accoridngly
    if (io.game.CurrentPlayer === null){
        // If this round is done, start next round
        console.log('proceed to next round')
        ee.emit('next round');
        return;
    } else {
        let player = io.game.players[io.game.CurrentPlayer];
        console.log('current io.game cycle and currentplayer', io.game.cycle, io.game.CurrentPlayer);
        //console.log('current player is', player);
        if (player.folded){
            // If folded, proceed to next player
            console.log('player ', player.username, ' already folded, skip to next player turn')
            io.game.CurrentPlayer += 1;
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
            io.sockets.sockets.get(socketid).broadcast.emit('watch', io.game, player) // other players watch
        }
    }
    
})

ee.on('next round',()=>{
    console.log('next round initiated, flip cards')
    io.emit('flip common cards'); // decide which cards to flip on client side
    io.game.round ++; // increment round
    console.log('round', io.game.round)
    ee.emit('start round');
})

ee.on('end game',()=>{
    console.log('Running end game')

    let noFoldPlayers = io.game.players.filter(player => !player.folded) // player who hasn't folded
    if (noFoldPlayers.length === 1){
        // Ended game early due to folds
        var winners = noFoldPlayers;
        io.game.winners = winners; // Set io.game.winners
        var winnerName = winners[0].username;
        var evalMsg = "Winner is " + winnerName + " because eveyone else folded"; // Compute eval message
        console.log('final eval msg', evalMsg);
        var winnerTokenValues = io.game.commonTokenValues;
    } else {
        // End game normally
        var evalMsg = io.game.returnEvalMsg(); // Set io.game.winners and Compute eval message for all users
        console.log('final eval msg', evalMsg)
        // Compute tokens for winners, split if needed
        console.log('computing tokens')
        let commonTokenValues = io.game.commonTokenValues;
        if (io.game.winners.length === 1){
            var winnerTokenValues = commonTokenValues;
        } else {
            var winnerTokenValues = io.game.splitTokens(commonTokenValues, winners.length);
        }
    }

    // Figure out winners
    let winnersocketids = io.game.winners.map(player=>player.socketid);
    console.log('winnerTokenValues', winnerTokenValues);
    console.log('winnersocketids', winnersocketids);
    let allsocketids = allSockets.map(socket=>socket.id);
    //! Set time out so last card can be flipped before displaying eval messages
    for (let socketid of allsocketids){
        if (winnersocketids.includes(socketid)){
            // Send message and token values to winners
            io.to(socketid).timeout(2000).emit('display and collect', evalMsg, winnerTokenValues);
        } else {
            // Send message to non-winners
            io.to(socketid).timeout(2000).emit('display and clear', evalMsg);
        }
    }
    io.game.commonTokenValues = [];
    console.log('Game has ended!!!')
})

ee.on('next game', ()=>{
    console.log('setting up next game');
    io.game.resetGame();
    console.log('next game is', io.game);
    io.game.setupCards();
    ee.emit('start round');
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
        this.commonCards = [];
        this.players.forEach(player=>{
            player.cards = [];
        })
        // reset game status
        this.winners = null;
        this.foldedCount = 0;
        this.cycle = 1;
        this.highestBet = 0;
        this.commonTokenValues = []; // already reset in 'compute tokens'
        // rotate players
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

    // Set player handCards (5 optimal cards), handName, handRank
    // rankCards (portion of handcards that make up rank)
    // highCards (portion of handcards that doesn't contribute to rank)
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
        // define handCards / handBool; set player handName, handRank
        if (isStraightFlush){
            var handCards = straightFlushCards;
            var handBool = false;
            player.handName = "Straight Flush";
            player.handRank = 1;
        } else if (numberFreqValues.includes(4)){
            var handBool = numbers.map((num) => numberFreq[num]===4);
            player.handName = "Four of a kind";
            player.handRank = 2;
        } else if (numberFreqValues.includes(3) && numberFreqValues.includes(2)){
            var handBool = numbers.map((num) => numberFreq[num]===3 || numberFreq[num]===2);
            player.handName = "Full House";
            player.handRank = 3;
        } else if (isFlush){
            var handBool = suits.map((num) => suitFreq[num]>=5);
            player.handName = "Flush";
            player.handRank = 4;
        } else if (isStraight){
            var handCards = straightCards;
            var handBool = false;
            player.handName = "Straight";
            player.handRank = 5;
        } else if (numberFreqValues.includes(3)){
            var handBool = numbers.map((num) => numberFreq[num]===3);
            player.handName = "Three of a kind";
            player.handRank = 6;
        } else if (numberFreqValues.includes(2) && numberFreqValues.indexOf(2) !== numberFreqValues.lastIndexOf(2)) {
            var handBool = numbers.map((num) => numberFreq[num]===2);
            player.handName = "Two pairs";
            player.handRank = 7;
        } else if (numberFreqValues.includes(2)){
            var handBool = numbers.map((num) => numberFreq[num]===2);
            player.handName = "One pair";
            player.handRank = 8;
        } else {
            // if no hand at all, select highest valued cards, i.e. remove two lowest
            cards.shift();
            cards.shift();
/*             player.handCards = cards;
            player.rankCards = []; */
            var handBool = false;
            var handCards = [];
            player.handName = "None";
            player.handRank = 9;
            return; 
        }

        // Select hand cards from handBool if not already calculated
        if (handBool !== false){
            var handCards = cards.filter((value, index)=>handBool[index]);
        }
        
        if (handCards.length === 5){
            // If hand already consists of 5 cards (e.g. straight, flush)
            player.handCards = handCards;
            player.rankCards = handCards;
            player.highCards = [];
        } else {
            // Select highest cards from remaining cards (ascending order)
            player.rankCards = handCards.map(x=>x);
            player.highCards = [];

            let remainingCards = cards.filter(card => !handCards.includes(card));
            let remainingLength = 5 - handCards.length;
            while(remainingLength>0){
                let maxCard = remainingCards.pop(); // card with max number is at the end
                handCards.push(maxCard);
                player.highCards.push(maxCard);
                remainingLength--;
            }
            player.handCards = handCards;
        }
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
        const minRank = Math.min.apply(null, allRanks); // lower rank = winner
        //console.log(allRanks, minRank)
        var winners = this.players.filter(player=>player.handRank === minRank); // array of winners
        //console.log('evaluateWinner winners:', winners);
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
        console.log('running evaluate high cards', winners, evalRank)
        // already sorted in ascending order
        if (evalRank){
            var player1Cards = winners[0].rankCards.map(x=>x);
            var player2Cards = winners[1].rankCards.map(x=>x);
        } else {
            var player1Cards = winners[0].highCards.map(x=>x);
            var player2Cards = winners[1].highCards.map(x=>x);
        }
        
        console.log(player1Cards, 'and', player2Cards)
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
        console.log('winners', winners);
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