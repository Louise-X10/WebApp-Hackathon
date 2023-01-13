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
    constructor(){
        this.playTable = document.querySelector('.player .table.cards');
        this.tokenTable = document.querySelector('.player .table.tokens');
        this.commonTable = document.querySelector('.common .table.cards');
        this.commonTokenTable = document.querySelector('.common .table.tokens');

        this.betBtn = document.querySelector('.action button.bet');
        this.foldBtn = document.querySelector('.action button.fold');
        
        this.folded = false;
        this.playerCards = []; // [card1, card2]
        this.commonCards = []; // [card1, ..., card5]

        this.money = 0; // total value of tokens this player owns
        this.tokens = {}; // token frequency dictionary {value : count}
        this.betValue = 0; // current bet value in one round

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

    // Display common cards
    setCommonCards (commonCards){
        commonCards.forEach(cardval=>{
            let card = new Card(cardval[0], cardval[1]); // create new card object from given values
            this.commonCards.push(card); // push card object to this.commoncards
            card.displayCard(this.commonTable);
        });
    }
    
    // Display player cards, setup cardflip listener
    setPlayerCards(playerCards){
        playerCards.forEach(cardval => {
            let card = new Card(cardval[0], cardval[1]); 
            this.playerCards.push(card);
            card.displayCard(this.playTable);
            card.container.addEventListener('click', this.flipListener)
        });
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

    selectListener(event){
        let token = event.target;
        token.classList.toggle("selected");
    }
    
    flipListener(event) {
        let card = event.currentTarget;
        card.classList.toggle('flip');
    }

    // Create token and return
    createToken(value){
        const token = document.createElement('img');
        token.src = tokenPath + `token_${value}.svg`
        token.alt = "token";
        token.classList.add("token", `_${value}`, "player");
        return token;
    }

    // Create and Place token of given value into table, Update token frequency dict
    // Setup token select listener
    addToken(value){
        let token = this.createToken(value);
        this.tokenTable.appendChild(token);
        this.money += value;
        this.tokens[value]? this.tokens[value] ++ : this.tokens[value] = 1;
        token.addEventListener('click', this.selectListener);
    }

    // clear all tokens on player table
    clearTokens(){
        let tokens = document.querySelectorAll(`#player .table.tokens img`);
        for (let token of tokens){
            this.tokenTable.removeChild(token);
        }
    }

    // read token value and return
    getTokenValue(token){
        let val = token.className.split(' ')[1];
        val = val.slice(1,val.length);
        return Number(val);
    }

    // move given token to player table
    //! Change collect mechanism to add tokens
    /* collectToken(token){
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
    } */

    // move given token to common table
    moveToken(token){
        token.classList.remove('selected');
        let cloneToken = token.cloneNode();
        cloneToken.classList.add('hidden');
        let xi = token.getBoundingClientRect()['x'];
        let yi = token.getBoundingClientRect()['y'];
        this.commonTokenTable.appendChild(cloneToken);
        let xf = cloneToken.getBoundingClientRect()['x'];
        let yf = cloneToken.getBoundingClientRect()['y'];
        this.commonTokenTable.removeChild(cloneToken);
        token.style.transform = `translate(${xf-xi}px, ${yf-yi}px)`;
        setTimeout(()=>{this.commonTokenTable.appendChild(token);
            token.style.transform = '';}, 1000);
    }

    //makeAction() // bet or fold

    // Make bet with selected tokens
    // If successful, remove selected tokens, update player bet value
    // If unsuccessul, unselected all tokens, make bet again
    makeBet(game, isFirstPlayer) {
        let success = true;
        console.log('!running make bet')
        let playerTokens = this.tokenTable.querySelectorAll('.token.selected');
        playerTokens = Array.from(playerTokens);
        let selectedTokenValues = playerTokens.map(token => this.getTokenValue(token));
        let sum = selectedTokenValues.reduce((sumValue, value)=> sumValue+value,0);
        console.log('sum', sum)

        if (game.cycle === 1){
            let betSuceed = sum >= game.highestBet || isFirstPlayer;
            if (betSuceed){
                // If on cycle 1, and bet higher than previous, then suceed and update highest bet value
                this.betValue = sum;
                playerTokens.forEach((token)=>this.moveToken(token));
            } else {
                alert(`You must bet at least ${game.highestBet} to match and stay in the game!` );
                sucess = false; //  make player bet again
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

        return [selectedTokenValues, sum, success]
    }

    receiveBet(selectedTokenValues) {
        selectedTokenValues.forEach((value)=>{
            let token = this.createToken(value);
            this.commonTokenTable.appendChild(token);
        })
    }

    makeFold(){
        this.folded = true;
        // Flip back any flipped cards
        this.playerCards.forEach((card)=>{
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
        //! Don't need to remove listener for folded players, they just wont get interact with server anymore
        /* let tokens = this.tokenTable.querySelectorAll('.token');
        tokens.forEach(token=>token.removeEventListener('click', this.selectListener))
        this.playerCards.forEach(card => card.container.removeEventListener('click', this.flipListener)); */
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

    // Create card container and display on given table
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

    // remove card from table
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
console.log('main js complete')

const player = new Player();
console.log('player is', player);

//! controlled by server
// const nextBtn = document.querySelector('button.next');
// const resetBtn = document.querySelector('button.reset');
//player.setButtons(nextBtn, betBtn, foldBtn);


//! in server
// players = [player1, player2]
/* const game = new Game(player1, player2);
game.setGame();
console.log('setup complete')
game.playGame(); */