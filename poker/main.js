const cardPath = '../cardsSVG/';

class Card {
    constructor(suit, value) {
        this.suit = suit;
        this.value = value;
        this.location = cardPath + suit + '_' + value + '.svg';
        this.flipped = false;
        this.container = null;
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
    constructor(table, common) {
        this.cards = [null, null]; // [card1, card2]
        this.money = 0;
        this.tokens = {}; // dictionary Z{value : [token1, token2, ...]}
        this.table = table;
        this.common = common;
    }

    setCards(card1, card2){
        this.cards = [card1, card2];
    }

    // Set tokens to totalvalue
    setTokens(totalValue) {
        this.clearTokens();
        this.addToken(100);
        while (this.money < totalValue){
            this.addToken(5);
        }
    }

    // Place token of given value into table
    addToken(value){
        const token = document.createElement('img');
        token.src = `token_${value}.svg`
        token.alt = "token";
        token.classList.add("token", `${value}`, "player");
        this.table.appendChild(token);
        this.money += value;
        if (this.tokens[value] === undefined){
            this.tokens[value] = [token];
        } else {
            this.tokens[value].push(token)
        }
    }

    // Remove token of given value from table
    // If move=true, move token to common table
    removeToken(value, move=false){
        // Error message if trying to remove non-existing token
        if (this.tokens[value] === undefined){
            alert("You do not have this token!")
        }
        let token = this.tokens[value].pop();
        this.money -= value;
        
        // If have no more tokens of this value
        if (this.tokens[value].length === 0){
            delete this.tokens[value];
        }
        if (move){
            // Trying to make this animate
            this.table.removeChild(token);
            this.common.appendChild(token);

        } else {
            this.table.removeChild(token);
        }
    }

    // clear all tokens on table
    clearTokens(){
        for (let value of Object.keys(this.tokens)){
            let numTokens = this.tokens[value].length;
            for (let i=0; i<numTokens; i++){
                this.removeToken(value);
            }
        }
        this.tokens = {};
    }

    
    makeBet(bet, fromLargest = true){
        if (bet > this.money){
            alert("You don't have enough money!")
        } else {
            let values = Object.keys(this.tokens);
            values = values.map(Number).sort((a,b)=> b-a); // descending order

            // Default: Start removing tokens from largest face value
            if (fromLargest){
                for (let value of values){
                    while (value <= bet) {
                        bet -= value;
                        this.removeToken(value, true);
                        console.log('remove', value, "remain to bet", bet)
                    }
                }
            // Start removing tokens from smallest face value
            }
        }
    }
}
const table = document.querySelector('#common .table.cards');
const playerBoard = document.querySelector('#player .table.cards');
const nextBtn = document.querySelector('button.next');

const playerToken = document.querySelector('#player .table.tokens')
const commonToken = document.querySelector('#common .table.tokens')
const betBtn = document.querySelector('button.bet');
const bet = document.querySelector('#bet');

const deck = new Deck();
const card1 = deck.deal('card1', table);
const card2 = deck.deal('card2', table);
const card3 = deck.deal('card3', table);
const card4 = deck.deal('card4', table);
const card5 = deck.deal('card5', table);
const playercard1 = deck.deal('playercard1', playerBoard);
const playercard2 = deck.deal('playercard1', playerBoard);
const player = new Player(playerToken, commonToken);
player.setCards(playercard1, playercard2);

function nextStep (){
    if (!playercard1.flipped){
        playercard1.flip();
        playercard2.flip();
    } else if (!card1.flipped){
        card1.flip();
        card2.flip();
        card3.flip();
    } else if (!card4.flipped){
        card4.flip();
    } else if (!card5.flipped){
        card5.flip();
    }
}

function makeBet (){
    let betValue = bet.textContent;

}
nextBtn.addEventListener('click', nextStep)
betBtn.addEventListener('click', makeBet)

player.setTokens(140);
//player.makeBet(20);

/*
// Click on any card on the table to flip it
// Bubble down from table to any div.card element
//! Need to fix this so that any card can respond, not just first card
table.addEventListener('click', event => {
    event.currentTarget.querySelector('.card').classList.toggle('flip')
});
*/