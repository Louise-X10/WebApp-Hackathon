const cardPath = 'cardsSVG/';
const tokenPath = 'tokensSVG/';

class Card {
    constructor(suit, value) {
        this.suit = suit;
        this.value = value;
        this.number = value;
        this.location = cardPath + suit + '_' + value + '.svg';
        this.container = null;

        switch(this.number){
            case "king":
                this.number = 13;
                break;
            case "queen": 
                this.number = 12;
                break;
            case "jack":
                this.number = 11;
                break;
            case "ace":
                this.number = 14; // or 1
        }
    }

    displayCard (cardID, table) {
        // Create card syntax
        this.container = document.createElement('div');
        this.container.classList.add('card');
        this.container.setAttribute('id', cardID);
        const front = document.createElement('div');
        front.classList.add('front');
        const back = document.createElement('div');
        back.classList.add('back');
        this.container.appendChild(front);
        this.container.appendChild(back);

        // Create card side image elements
        const frontImg = document.createElement('img');
        frontImg.src = this.location;
        frontImg.alt = this.suit + ' ' + String(this.value);
        const backImg = document.createElement('img');
        backImg.src = cardPath + 'back.svg';
        backImg.alt = 'back';

        // Add card side images to card syntax
        front.appendChild(frontImg);
        back.appendChild(backImg);
        table.appendChild(this.container);
        this.table = table;
    }

    removeCard(){
        this.table.removeChild(this.container);
    }

    flip () {
        this.container.classList.toggle('flip');
    }

    isFlipped(){
        return this.container.classList.contains('flip');
    }
}

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
                this.deck.push(new Card(suit, value));
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

    deal(cardID, table) {
        const card = this.deck.pop();
        card.displayCard(cardID, table);
        return card;
    }

}

//* Token functions
function createToken(value){
    const token = document.createElement('img');
    token.src = tokenPath + `token_${value}.svg`
    token.alt = "token";
    token.classList.add("token", `_${value}`, "player");
    return token;
}

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

class Player {
    constructor(container, common){
        this.container = container;
        let tables = container.querySelectorAll('.table');
        this.playtable = tables[0];
        this.tokentable = tables[1];
        this.commontable = common;
        this.folded = false;
        this.firstPlayer = false;

        this.cards = [null, null]; // [card1, card2]
        this.btns = [null, null, null]; // [nextBtn, betBtn, foldBtn]

        this.money = 0;
        this.tokens = {}; // dictionary {value : count}

        this.betValue = 0;

        this.handCards = []; // in ascending order after evaluate
        this.handName = '';
        this.handRank = null;
        this.rankCards = [];
        this.highCards = [];
        this.setTokens();

        // Get all defined class methods
        const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(this));

        // Bind all methods
        methods
            .filter(method => (method !== 'constructor'))
            .forEach((method) => { this[method] = this[method].bind(this); });
    }

    setCards(card1, card2){
        this.cards = [card1, card2];
    }

    setButtons(nextBtn, betBtn, foldBtn){
        this.btns = [nextBtn, betBtn, foldBtn];
    }

    // Set tokens to totalvalue
    setTokens(totalValue=260) { // 4*50 + 4*10 + 4*5 = 260
        this.clearTokens();
        while (this.money < totalValue && this.money < 200){
            this.addToken(50);
        }
        while (this.money < totalValue && this.money < 240){
            this.addToken(10);
        }
        while (this.money < totalValue){
            this.addToken(5);
        }
    }

    // (Create and) Place token of given value into table
    addToken(value){
        let token = createToken(value);
        this.tokentable.appendChild(token);
        this.money += value;
        this.tokens[value]? this.tokens[value] ++ : this.tokens[value] = 1;
    }

    // clear all tokens on player table
    clearTokens(){
        let tokens = document.querySelectorAll(`#player .table.tokens img`);
        for (let token of tokens){
            this.tokentable.removeChild(token);
        }
    }

    // move given token to player table
    collectToken(token){
        let cloneToken = token.cloneNode();
        cloneToken.classList.add('hidden');
        let xi = token.getBoundingClientRect()['x'];
        let yi = token.getBoundingClientRect()['y'];
        this.tokentable.appendChild(cloneToken);
        let xf = cloneToken.getBoundingClientRect()['x'];
        let yf = cloneToken.getBoundingClientRect()['y'];
        this.tokentable.removeChild(cloneToken);
        token.style.transform = `translate(${xf-xi}px, ${yf-yi}px)`;
        setTimeout(()=>{this.tokentable.appendChild(token);
            token.style.transform = '';}, 1000);
    }

    // move given token to common table
    moveToken(token){
        token.classList.remove('selected');
        let cloneToken = token.cloneNode();
        cloneToken.classList.add('hidden');
        let xi = token.getBoundingClientRect()['x'];
        let yi = token.getBoundingClientRect()['y'];
        this.commontable.appendChild(cloneToken);
        let xf = cloneToken.getBoundingClientRect()['x'];
        let yf = cloneToken.getBoundingClientRect()['y'];
        this.commontable.removeChild(cloneToken);
        token.style.transform = `translate(${xf-xi}px, ${yf-yi}px)`;
        setTimeout(()=>{this.commontable.appendChild(token);
            token.style.transform = '';}, 1000);
    }

    // Make bet and update highest bet, return whether bet was successful
    makeBet() {
        let success = true;
        console.log('!running make bet')
        console.log(this)
        let playerTokens = this.tokentable.querySelectorAll('.token.selected');
        playerTokens = Array.from(playerTokens);
        let sum = playerTokens.reduce((sumValue, token)=> sumValue+getTokenValue(token),0);
        console.log('sum', sum)
        if (game.cycle === 1){
            let betSuceed = sum >= game.highestBet || this.firstPlayer === true;
            if (betSuceed){
                // If on cycle 1, and bet higher than previous, then suceed and update highest bet value
                this.betValue = sum;
                game.highestBet = Math.max(game.highestBet, this.betValue);
                playerTokens.forEach((token)=>this.moveToken(token));
            } else {
                alert(`You must bet at least ${game.highestBet} to match and stay in the game!` );
                success = false;
            }
        } else if (game.cycle === 2){
            let mustMatch = game.highestBet - this.betValue;
            if (mustMatch !== 0 && sum === mustMatch){
                // If on cycle 2 and match highest bet, bet suceeds
                this.betValue += sum;
                playerTokens.forEach((token)=>this.moveToken(token));
            } else if (mustMatch !== 0 && sum !== mustMatch){
                // If on cycle 2 and doesn't match highest bet, bet again
                alert(`You must bet ${mustMatch} to match and stay in the game!` );
                success = false; //  make player bet again
            } // If on cycle 2 and already match highest bet, do nothing
        }

        // Flip back any flipped cards
        this.cards.forEach((card)=>{
            if (card.isFlipped()){card.flip()};
        })
        return success;
    }

    makeFold(){
        this.folded = true;
        // Flip back any flipped cards
        this.cards.forEach((card)=>{
            if (card.container.classList.contains('flip')){card.flip()};
        })
        // Unselect any selected tokens
        let selectedTokens = this.tokentable.querySelectorAll('.token.selected');
        selectedTokens.forEach((token)=> token.classList.remove('selected'));
        // Set folded status to true
        this.folded = true;
        // Increment number of players folded in the game
        game.foldedCount ++;
        // Remove token and card listeners
        let tokens = this.tokentable.querySelectorAll('.token');
        tokens.forEach(token=>token.removeEventListener('click', this.selectListener))
        let cards = this.container.querySelectorAll('.card');
        cards.forEach(container => container.removeEventListener('click', this.flipListener));
    }
}

class Game {
    constructor(player1, player2){
        this.winner = null;
        this.foldedCount = 0;
        this.playerCount = 2;
        this.cycle = 1;
        this.highestBet = 0;
        this.player1 = player1;
        this.player2 = player2;
        this.players = [this.player1, this.player2]
        this.CurrentPlayer = this.player1;

        // Get all defined class methods: only gets public methods
        const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(this));

        // Bind all methods
        methods
            .filter(method => (method !== 'constructor'))
            .forEach((method) => { this[method] = this[method].bind(this); });
    }

    setGame(){
        this.setupCards();
        this.setupCardInteraction();
        this.setupTokenInteraction();
        this.setupListeners();
        let startRoundEvent = new CustomEvent('startRound');
        this.startRoundEvent = startRoundEvent;
    }

    // Don't need to reset listeners, need to remove prior cards and generate new cards
    resetGame(){
        this.commonCards.forEach(card=>card.removeCard());
        this.players.forEach(player=>{
            player.cards.forEach(card => card.removeCard());
        })
        this.setupCards();
        this.setupCardInteraction();
    }

    playGame(){
        window.dispatchEvent(this.startRoundEvent);
    }

    // generate and save cards for this game
    setupCards(){
        const deck = new Deck();
        this.card1 = deck.deal('card1', commonTable);
        this.card2 = deck.deal('card2', commonTable);
        this.card3 = deck.deal('card3', commonTable);
        this.card4 = deck.deal('card4', commonTable);
        this.card5 = deck.deal('card5', commonTable);
        this.commonCards = [this.card1, this.card2, this.card3, this.card4, this.card5];

        this.player1card1 = deck.deal('player1card1', this.player1.playtable);
        this.player1card2 = deck.deal('player1card2', this.player1.playtable);
        this.player2card1 = deck.deal('player2card1', this.player2.playtable);
        this.player2card2 = deck.deal('player2card2', this.player2.playtable);

        this.player1.setCards(this.player1card1, this.player1card2);
        this.player2.setCards(this.player2card1, this.player2card2);
    }

    // setup user interaction with tokens and cards
    setupTokenInteraction(){
        //* Set up motion for tokens
        // Click to select and highlight tokens
        const tokens = document.querySelectorAll('.table.tokens img');
        tokens.forEach(token => token.addEventListener('click', this.selectListener))
        
    }

    // setup user interaction with cards
    setupCardInteraction(){
        //* Set up motion for cards
        // Click on any player card on the table to flip it
        let allCards = document.querySelectorAll('.card[id^=player]');
        allCards.forEach(container => container.addEventListener('click', this.flipListener));
    }

    
    
    selectListener(event){
        let token = event.target;
        token.classList.toggle("selected");
    }
    
    flipListener(event) {
        event.currentTarget.classList.toggle('flip');
    }

    // setup global listeners to play rounds
    setupListeners(){
        // when playOnce event is fired, play a new turn with current player then update
        window.addEventListener('playOnce', (e) => {this.playerTurn(e.detail);})

        // when startRound event is fired, a new round will initiate
        window.addEventListener('startRound', (e)=>{this.oneRound();});
    }

    // Initiate new round, reset highest bet
    oneRound(){
        this.CurrentPlayer = this.player1;
        this.highestBet = 0;
        let playEvent = new CustomEvent('playOnce',{ detail: this.CurrentPlayer})
        window.dispatchEvent(playEvent)
        console.log('dispatch first play event')
    }

    // Set player.hand and player.handName
    evaluateHand(player, cardsGiven){
        var cards = cardsGiven.map(x=>x); // sort cards in ascending number order
        cards.sort((card1, card2)=> card1.number - card2.number);

        let numbers = cards.map(c => c.number);
        let suits = cards.map(c => c.suit);
        
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

        // Select hand cards from handBool if needed
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

        let numbersCloneDuplicates = cards.map(c => c.number); // clone numbers array
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

    // Return winner of current round
    evaluateWinner(player1, player2){
        // Return [winner, highCard]
        // highCard=true if rank name are the same and need to compare high cards
        // winner=null if both players have same cards
        let highCard = false;
        if (player1.handRank < player2.handRank){
            return [[player1], highCard];
        } else if (player1.handRank > player2.handRank){
            return [[player2], highCard];
        } else {
            highCard = true;
            // sorted in ascending order
            let player1Cards = player1.rankCards.map(x=>x);
            let player2Cards = player2.rankCards.map(x=>x);
            var winner = this.evaluateHighCards(player1Cards, player2Cards);
            // If not tie, return winner
            if (winner.length===1){
                return [winner, highCard];
            }
            // If tie, continue to evaluate remaining cards
            player1Cards = player1.highCards.map(x=>x);
            player2Cards = player2.highCards.map(x=>x);
            winner = this.evaluateHighCards(player1Cards, player2Cards);
            return [winner, highCard];
        }
    }

    // Helper for evaluateWinner, return array of winners
    evaluateHighCards(player1Cards, player2Cards){
        // Compare list of cards by number until list exhausts
        while(player1Cards.length>0){
            let player1card = player1Cards.pop();
            let player2card = player2Cards.pop();
            if (player1card.number === player2card.number){
                continue
            } else if (player1card.number > player2card.number){
                return [this.player1];
            } else if (player1card.number < player2card.number){
                return [this.player2];
            }
        }
        return [this.player1, this.player2]; // tie with completely same cards
    }

    //* Set up nextBtn listener and proceed to next step
    nextStep() {
        // Make next button clickable once every round
        nextBtn.addEventListener('click', this.nextAction, {once: true});
    }

    // After pressing next button: flip common cards, display eval message, collect tokens and end this round (set startRound=true)
    nextAction (){
        document.querySelector('.area.common').classList.remove('playing');
        if(nextBtn.textContent === 'Next Step'){
            console.log(this)
            if (!this.card1.isFlipped()){
                this.card1.flip();
                this.card2.flip();
                this.card3.flip();
                window.dispatchEvent(this.startRoundEvent);
            } else if (!this.card4.isFlipped()){
                this.card4.flip();
                window.dispatchEvent(this.startRoundEvent);
            } else if (!this.card5.isFlipped()){
                this.card5.flip();
                nextBtn.textContent = 'Reveal Hand';
                this.nextStep(); // setup listener but don't start new round because don't need to bet anymore
            }
        } else {
            this.endGame();
        }
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
            /* // If use alert, need setTimeOut to make async so that cards can start flipping back even while message is not crossed out
            alert(evalMsg);
            setTimeout(()=>{
                alert(evalMsg);
                nextStep(); // setup listener but don't start new round
            }, 500) */
        } else if (nextBtn.textContent === 'Reveal Hand') {
            // If normal end, reveal winner and hands, setup collect tokens
            this.evaluateHand(this.player1, this.commonCards.concat(this.player1.cards));
            this.evaluateHand(this.player2, this.commonCards.concat(this.player2.cards));
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

    //* Set up player fold and bet listeners and proceed to next player
    // During each player's turn, set up bet button listener
    // Once bet button is pressed once, update currrent player to next player and call playerTurn
    // Once all player's played, update current player to null, then run next button and end this round 
    playerTurn(player){
        console.log('running playerTurn')
        // Update current player and set up to let next player act
        function nextPlayerTurn(player){ 
            switch(player){
                case (this.player1):
                    console.log("Currently player1, next round player 2");
                    this.CurrentPlayer = this.player2;
                    break;
                case (this.player2):
                    let allMatch = this.players.map(player=>player.betValue).filter(value => value === this.highestBet).length === this.players.length;
                    if (!allMatch && this.cycle===1){
                        // If not all players match during first cycle, play second cycle
                        console.log("Currently player2, next round player 1 (next cycle)");
                        this.cycle = 2;
                        this.CurrentPlayer = this.player1;
                        break;
                    } else {
                        // If all players match, end this round
                        console.log("Currently player2, next round next button)");
                        this.CurrentPlayer =  null;
                        this.cycle=1;
                    }
                    break;
            }
            console.log('dispatch play event and run playerTurn on next player');
            let playEvent = new CustomEvent('playOnce',{ detail: this.CurrentPlayer});
            window.dispatchEvent(playEvent);
        }
        nextPlayerTurn = nextPlayerTurn.bind(this);

        if (this.foldedCount === this.playerCount-1){
            console.log('end game early routine')
            // End game early if everyone else has folded
            console.log('end game early')
            this.endGame(true);
        } else if (!player){
            console.log('end round routine')
            // Proceed to end round if at end of all turns
            document.querySelector('.area.common').classList.add('playing');
            this.nextStep();
            return;
        } else if (!player.folded){ 
            console.log('normal player routine')
            // Let player act if player hasn't folded
            player.container.classList.add('playing');
            let playerBetBtn = player.btns[1];
            let playerFoldBtn = player.btns[2];

            // Set up bet button listener for only one click only, only one button each turn
            function betAction(){
                let success = player.makeBet();
                console.log("success", success);
                if (success){
                    playerBetBtn.removeEventListener('click', betAction);
                    playerFoldBtn.removeEventListener('click', foldAction);
                    player.container.classList.remove('playing');
                    nextPlayerTurn(player);
                } else {
                    console.log('dispatch play event and run playerTurn on current player AGAIN');
                    let playEvent = new CustomEvent('playOnce',{ detail: player});
                    window.dispatchEvent(playEvent);
                }
            }

            function foldAction(){
                player.makeFold();
                console.log('player has folded')
                playerBetBtn.removeEventListener('click', betAction);
                playerFoldBtn.removeEventListener('click', foldAction);
                player.container.classList.remove('playing');
                console.log('let next player take action')
                nextPlayerTurn(player)
            }

            if (this.cycle === 2 && this.highestBet === player.betValue){
                // If during match round but don't need to match, just proceed to next player
                player.container.classList.remove('playing');
                nextPlayerTurn(player)
            } else {
                // Otherwise listen to player movement
                console.log("set up player listeners")
                playerBetBtn.addEventListener('click', betAction, {once: true}); 
                playerFoldBtn.addEventListener('click', foldAction, {once: true});
            }
        } else {
            console.log('folded routine')
            // If player folded, just proceed to next player
            nextPlayerTurn(player);
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

const commonTable = document.querySelector('.common .table.cards');
const commonTokenTable = document.querySelector('.common .table.tokens');
const playerContainer1 = document.querySelector('#player1');
const playerContainer2 = document.querySelector('#player2');

const player1 = new Player(playerContainer1, commonTokenTable);
player1.firstPlayer = true;
const player2 = new Player(playerContainer2, commonTokenTable);
const players = [player1, player2];

const nextBtn = document.querySelector('button.next');
const resetBtn = document.querySelector('button.reset');
const betBtn1 = document.querySelector('#player1 button.bet');
const betBtn2 = document.querySelector('#player2 button.bet');
const foldBtn1 = document.querySelector('#player1 button.fold');
const foldBtn2 = document.querySelector('#player2 button.fold');
player1.setButtons(nextBtn, betBtn1, foldBtn1);
player2.setButtons(nextBtn, betBtn2, foldBtn2);

const game = new Game(player1, player2);
game.setGame();
console.log('setup complete')
game.playGame();