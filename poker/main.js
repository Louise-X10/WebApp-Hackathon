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

//* Token functions
const tokenPath = 'tokensSVG/';
function createToken(value){
    const token = document.createElement('img');
    token.src = tokenPath + `token_${value}.svg`
    token.alt = "token";
    token.classList.add("token", `_${value}`, "player");
    return token;
}

const commonTable = document.querySelector('.common .table.cards');
const commonTokenTable = document.querySelector('.common .table.tokens');
const playerContainer = document.querySelector('.player');

const player = new Player(playerContainer, commonTokenTable);
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