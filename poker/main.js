//* Token functions
const cardPath = 'cardsSVG/';
const tokenPath = 'tokensSVG/';
function createToken(value){
    const token = document.createElement('img');
    token.src = tokenPath + `token_${value}.svg`
    token.alt = "token";
    token.classList.add("token", `_${value}`, "player");
    return token;
}

class Player {
    constructor(container, common, commonToken){
        this.playTable = document.querySelector('.player .table.cards');
        this.tokenTable = document.querySelector('.player .table.tokens');
        this.commonTable = document.querySelector('.common .table.cards');
        this.commonTokenTable = document.querySelector('.common .table.tokens');
        this.folded = false;

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

    setCommonCards (commonCards){
        console.log('start setting');
        commonCards.forEach(cardval=>{
            // create new card object and display
            let card = new Card(cardval[0], cardval[1]);
            console.log(card);
            card.displayCard(this.commonTable);
        });
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
        this.tokenTable.appendChild(token);
        this.money += value;
        this.tokens[value]? this.tokens[value] ++ : this.tokens[value] = 1;
    }

    // clear all tokens on player table
    clearTokens(){
        let tokens = document.querySelectorAll(`#player .table.tokens img`);
        for (let token of tokens){
            this.tokenTable.removeChild(token);
        }
    }

    // move given token to player table
    collectToken(token){
        let cloneToken = token.cloneNode();
        cloneToken.classList.add('hidden');
        let xi = token.getBoundingClientRect()['x'];
        let yi = token.getBoundingClientRect()['y'];
        this.tokenTable.appendChild(cloneToken);
        let xf = cloneToken.getBoundingClientRect()['x'];
        let yf = cloneToken.getBoundingClientRect()['y'];
        this.tokenTable.removeChild(cloneToken);
        token.style.transform = `translate(${xf-xi}px, ${yf-yi}px)`;
        setTimeout(()=>{this.tokenTable.appendChild(token);
            token.style.transform = '';}, 1000);
    }

    // move given token to common table
    moveToken(token){
        token.classList.remove('selected');
        let cloneToken = token.cloneNode();
        cloneToken.classList.add('hidden');
        let xi = token.getBoundingClientRect()['x'];
        let yi = token.getBoundingClientRect()['y'];
        this.commonTable.appendChild(cloneToken);
        let xf = cloneToken.getBoundingClientRect()['x'];
        let yf = cloneToken.getBoundingClientRect()['y'];
        this.commonTable.removeChild(cloneToken);
        token.style.transform = `translate(${xf-xi}px, ${yf-yi}px)`;
        setTimeout(()=>{this.commonTable.appendChild(token);
            token.style.transform = '';}, 1000);
    }

    // Make bet and update highest bet, return whether bet was successful
    makeBet() {
        let success = true;
        console.log('!running make bet')
        console.log(this)
        let playerTokens = this.tokenTable.querySelectorAll('.token.selected');
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
        let selectedTokens = this.tokenTable.querySelectorAll('.token.selected');
        selectedTokens.forEach((token)=> token.classList.remove('selected'));
        // Set folded status to true
        this.folded = true;
        // Increment number of players folded in the game
        game.foldedCount ++;
        // Remove token and card listeners
        let tokens = this.tokenTable.querySelectorAll('.token');
        tokens.forEach(token=>token.removeEventListener('click', this.selectListener))
        let cards = this.playTable.querySelectorAll('.card');
        cards.forEach(container => container.removeEventListener('click', this.flipListener));
    }
}

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

    displayCard (table) {
        // Create card syntax
        this.container = document.createElement('div');
        this.container.classList.add('card');
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

const player = new Player();
console.log('player is', player)
//player.firstPlayer = true;

const nextBtn = document.querySelector('button.next');
const resetBtn = document.querySelector('button.reset');
const betBtn = document.querySelector('.player button.bet');
const foldBtn = document.querySelector('.player button.fold');
player.setButtons(nextBtn, betBtn, foldBtn);
console.log('main js complete')

//! in server
// players = [player1, player2]
/* const game = new Game(player1, player2);
game.setGame();
console.log('setup complete')
game.playGame(); */