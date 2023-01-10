const cardPath = 'cardsSVG/';
const tokenPath = 'tokensSVG/';

class Card {
    constructor(suit, value) {
        this.suit = suit;
        this.value = value;
        this.number = value;
        this.location = cardPath + suit + '_' + value + '.svg';
        this.flipped = false;
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
    }

    flip () {
        this.container.classList.toggle('flip');
        this.flipped = !this.flipped;
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

class Player {
    constructor(container, common){
        this.container = container;
        let tables = container.querySelectorAll('.table');
        this.playtable = tables[0];
        this.tokentable = tables[1];
        this.commontable = common;

        this.cards = [null, null]; // [card1, card2]
        this.btns = [null, null]; // [nextBtn, betBtn]

        this.money = 0;
        this.tokens = {}; // dictionary {value : count}

        this.handCards = [];
        this.handName = '';
        this.setTokens();
    }

    setCards(card1, card2){
        this.cards = [card1, card2];
    }

    setButtons(nextBtn, betBtn){
        this.btns = [nextBtn, betBtn];
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

    // Place token of given value into table
    addToken(value){
        const token = document.createElement('img');
        token.src = tokenPath + `token_${value}.svg`
        token.alt = "token";
        token.classList.add("token", `_${value}`, "player");
        this.tokentable.appendChild(token);
        this.money += value;
        this.tokens[value]? this.tokens[value] ++ : this.tokens[value] = 1;
    }

    // clear all tokens on table
    clearTokens(){
        let tokens = document.querySelectorAll(`#player .table.tokens img`);
        for (let token of tokens){
            this.tokentable.removeChild(token);
        }
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

    makeBet() {
        let playerTokens = this.tokentable.querySelectorAll('.token.selected');
        playerTokens.forEach((token)=>this.moveToken(token));
    }
}

// Only checks for straight, no flush, in given set of cards
// Returns list of straight cards, or [] if none
function returnStraight(cards){
    // Don't need to check for straight if not enough 5 cards
    if (cards.length < 5){
        return [];
    }

    let numbersCloneDuplicates = cards.map(c => c.number); // clone numbers array
    let numbersNoDuplicate = new Set(numbersCloneDuplicates);
    numbersClone = Array.from(numbersNoDuplicate.values()); // with no duplicates

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

// Set player.hand and player.handName
function evaluateHand(player, cardsGiven){
    // sort cards in asending number order
    var cards = cardsGiven.map(x=>x);
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
        var straightFlushCards = returnStraight(flushCards);
    }
    let straightCards = returnStraight(cards);
    let isStraightFlush = straightFlushCards.length > 0;
    let isStraight = straightCards.length > 0;

    // handCards: list of cards to form a hand
    // handName: name of hand
    // handBool: list of booleans [true, false, ...] used to generate handCards from cards
    if (isStraightFlush){
        var handCards = straightFlushCards;
        var handBool = false;
        var handName = "Straight Flush";
    } else if (numberFreqValues.includes(4)){
        var handBool = numbers.map((num) => numberFreq[num]===4);
        var handName = "Four of a kind";
    } else if (numberFreqValues.includes(3) && numberFreqValues.includes(2)){
        var handBool = numbers.map((num) => numberFreq[num]===3 || numberFreq[num]===2);
        var handName = "Full House";
    } else if (isFlush){
        var handBool = suits.map((num) => suitFreq[num]>=5);
        var handName = "Flush";
    } else if (isStraight){
        var handCards = straightCards;
        var handBool = false;
        var handName = "Straight";
    } else if (numberFreqValues.includes(3)){
        var handBool = numbers.map((num) => numberFreq[num]===3);
        var handName = "Three of a kind";
    } else if (numberFreqValues.includes(2) && numberFreqValues.indexOf(2) !== numberFreqValues.lastIndexOf(2)) {
        var handBool = numbers.map((num) => numberFreq[num]===2);
        var handName = "Two pairs";
    } else if (numberFreqValues.includes(2)){
        var handBool = numbers.map((num) => numberFreq[num]===2);
        var handName = "One pair";
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
    
    // Select remaining highest cards
    if (handCards.length < 5){
        let remainingCards = cards.filter(card => !handCards.includes(card));
        let remainingLength = 5 - handCards.length;
        while(remainingLength>0){
            let maxCard = remainingCards.pop(); // card with max number is at the end
            handCards.push(maxCard);
            remainingLength--;
        }
    }

    player.handCards = handCards;
    player.handName = handName;
}

const commonTable = document.querySelector('.common .table.cards');
const commonTokenTable = document.querySelector('.common .table.tokens');
const playerContainer1 = document.querySelector('#player1');
const playerContainer2 = document.querySelector('#player2');

const player1 = new Player(playerContainer1, commonTokenTable);
const player2 = new Player(playerContainer2, commonTokenTable);

const nextBtn = document.querySelector('button.next');
const betBtn1 = document.querySelector('#player1 button.bet');
const betBtn2 = document.querySelector('#player2 button.bet');
player1.setButtons(nextBtn, betBtn1);
player2.setButtons(nextBtn, betBtn2);

const deck = new Deck();
const card1 = deck.deal('card1', commonTable);
const card2 = deck.deal('card2', commonTable);
const card3 = deck.deal('card3', commonTable);
const card4 = deck.deal('card4', commonTable);
const card5 = deck.deal('card5', commonTable);
const commonCards = [card1, card2, card3, card4, card5];

const player1card1 = deck.deal('player1card1', player1.playtable);
const player1card2 = deck.deal('player1card2', player1.playtable);
const player2card1 = deck.deal('player2card1', player2.playtable);
const player2card2 = deck.deal('player2card2', player2.playtable);

player1.setCards(player1card1, player1card2);
player2.setCards(player2card1, player2card2);


// Click to select and highlight tokens
function selectTokens(event){
    let token = event.target;
    token.classList.add("selected");
}
const tokens = document.querySelectorAll('.table.tokens img');
tokens.forEach(token => token.addEventListener('click', () => token.classList.add('selected')))

// Click on any player card on the table to flip it
allCards = document.querySelectorAll('.card[id^=player]');
allCards.forEach(card => card.addEventListener('click', () => card.classList.toggle('flip')));

// After pressing next button, flip common cards and display eval message
function nextAction (){
    if (!card1.flipped){
        card1.flip();
        card2.flip();
        card3.flip();
    } else if (!card4.flipped){
        card4.flip();
    } else if (!card5.flipped){
        card5.flip();
        nextBtn.textContent = 'Reveal Hand';
    } else {
        evaluateHand(player1, commonCards.concat(player1.cards));
        evaluateHand(player2, commonCards.concat(player2.cards));
        alert("Player1: ", player1.handName, "; Player2: ", player2.handName);
        return;
    }
    nextBtn.removeEventListener('click', nextAction);
}
// Make next button clickable once every round
function nextRound(){
    nextBtn.addEventListener('click', nextAction);
}

// During each player's turn, set up bet button listener
// Once bet button is pressed once, move to next player's turn
// Once all player's played, set up next button listener
function playerTurn(player){
    player.container.classList.add('playing');
    let playerBetBtn = player.btns[1];
    // Set up bet button listener for one click only
    function betAction(){
        player.makeBet();
        playerBetBtn.removeEventListener('click', betAction);
        player.container.classList.remove('playing');
        switch(player){
            case player1:
                console.log("Currently player1");
                player = player2;
                break;
            case player2:
                console.log("Currently player2");
                player =  null;
                break;
        }
    }
    playerBetBtn.addEventListener('click', betAction);
}

function oneRound () {
/*     let state = player1;
    state = playerTurn(state);
    playerTurn(player1);
    playerTurn(player2); */
}