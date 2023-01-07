const imgPath = '../cardsSVG/';

class Card {
    constructor(suit, value) {
        this.suit = suit;
        this.value = value;
        this.location = imgPath + suit + '_' + value + '.svg';
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
        backImg.src = imgPath + 'back.svg';
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

const table = document.querySelector('div.table#common');
const playerBoard = document.querySelector('div.table#player');
const btn = document.querySelector('button.next');

const deck = new Deck();
const card1 = deck.deal('card1', table);
const card2 = deck.deal('card2', table);
const card3 = deck.deal('card3', table);
const card4 = deck.deal('card4', table);
const card5 = deck.deal('card5', table);
const playercard1 = deck.deal('playercard1', playerBoard);
const playercard2 = deck.deal('playercard1', playerBoard);

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

btn.addEventListener('click', nextStep)
/*
// Click on any card on the table to flip it
// Bubble down from table to any div.card element
//! Need to fix this so that any card can respond, not just first card
table.addEventListener('click', event => {
    event.currentTarget.querySelector('.card').classList.toggle('flip')
});
*/