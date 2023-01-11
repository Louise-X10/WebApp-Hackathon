
// straight flush
card1 = new Card("diamonds", 5)
card2 = new Card("diamonds", 4)
card3 = new Card("diamonds", 3)
card4 = new Card("diamonds", 2)
card5 = new Card("diamonds", "ace")
playercard1 = new Card("clubs", 5)
playercard2 = new Card("hearts", 5)
cardsGiven = [card1, card2, card3, card4, card5, playercard1, playercard2]
evaluateHand(player, cardsGiven)
player

// four of a kind
card1 = new Card("diamonds", 5)
card2 = new Card("spades", 5)
card3 = new Card("diamonds", 3)
card4 = new Card("diamonds", 2)
card5 = new Card("diamonds", "ace")
playercard1 = new Card("clubs", 5)
playercard2 = new Card("hearts", 5)
cardsGiven = [card1, card2, card3, card4, card5, playercard1, playercard2]
evaluateHand(player, cardsGiven)
player

// full house
card1 = new Card("diamonds", 5)
card2 = new Card("diamonds", 4)
card3 = new Card("diamonds", 3)
card4 = new Card("spades", 3)
card5 = new Card("diamonds", "ace")
playercard1 = new Card("clubs", 5)
playercard2 = new Card("hearts", 5)
cardsGiven = [card1, card2, card3, card4, card5, playercard1, playercard2]
evaluateHand(player, cardsGiven)
player

// flush
card1 = new Card("diamonds", 7)
card2 = new Card("diamonds", 11)
card3 = new Card("diamonds", 3)
card4 = new Card("diamonds", 2)
card5 = new Card("diamonds", "ace")
playercard1 = new Card("clubs", 9)
playercard2 = new Card("hearts", 9)
cardsGiven = [card1, card2, card3, card4, card5, playercard1, playercard2]
evaluateHand(player, cardsGiven)
player

// straight 
card1 = new Card("diamonds", 5)
card2 = new Card("diamonds", 4)
card3 = new Card("diamonds", 3)
card4 = new Card("diamonds", 2)
card5 = new Card("spades", "ace")
playercard1 = new Card("clubs", 9)
playercard2 = new Card("hearts", 9)
cardsGiven = [card1, card2, card3, card4, card5, playercard1, playercard2]
evaluateHand(player, cardsGiven)
player

// three of a kind
card1 = new Card("diamonds", 9)
card2 = new Card("diamonds", 4)
card3 = new Card("diamonds", 3)
card4 = new Card("diamonds", 2)
card5 = new Card("spades", "ace")
playercard1 = new Card("clubs", 9)
playercard2 = new Card("hearts", 9)
cardsGiven = [card1, card2, card3, card4, card5, playercard1, playercard2]
evaluateHand(player, cardsGiven)
player

// two pairs
card1 = new Card("diamonds", 8)
card2 = new Card("diamonds", 8)
card3 = new Card("diamonds", 3)
card4 = new Card("diamonds", 2)
card5 = new Card("spades", "ace")
playercard1 = new Card("clubs", 9)
playercard2 = new Card("hearts", 9)
cardsGiven = [card1, card2, card3, card4, card5, playercard1, playercard2]
evaluateHand(player, cardsGiven)
player

// one pair
card1 = new Card("diamonds", 8)
card2 = new Card("diamonds", 4)
card3 = new Card("diamonds", 3)
card4 = new Card("diamonds", 2)
card5 = new Card("spades", "ace")
playercard1 = new Card("clubs", 9)
playercard2 = new Card("hearts", 9)
cardsGiven = [card1, card2, card3, card4, card5, playercard1, playercard2]
evaluateHand(player, cardsGiven)
player

// none
card1 = new Card("diamonds", 8)
card2 = new Card("diamonds", 4)
card3 = new Card("diamonds", 3)
card4 = new Card("diamonds", 2)
card5 = new Card("spades", "ace")
playercard1 = new Card("clubs", 9)
playercard2 = new Card("hearts", 7)
cardsGiven = [card1, card2, card3, card4, card5, playercard1, playercard2]
evaluateHand(player, cardsGiven)
player

//Debug evaluation
var cards = cardsGiven.map(x=>x);
cards.sort((card1, card2)=> card1.number - card2.number);

// Debug animation
let token = document.querySelector('.token')
let cloneToken = token.cloneNode();
cloneToken.classList.add('hidden');

let xi = token.getBoundingClientRect()['x'];
let yi = token.getBoundingClientRect()['y'];
player.common.appendChild(cloneToken);
let xf = cloneToken.getBoundingClientRect()['x'];
let yf = cloneToken.getBoundingClientRect()['y'];
player.common.removeChild(cloneToken);

token.classList.add('moving');
token.style.transform = `translate(${xf-xi}px, ${yf-yi}px)`;
token.classList.remove('moving');

player.common.appendChild(token);
token.style.transform = '';

// Two player take turns

playerTurn(player1)
getEventListeners(betBtn1)
getEventListeners(betBtn2)
getEventListeners(nextBtn)

// Debug evaluate winner
card1 = new Card("spades", 6)
card2 = new Card("clubs", 9)
card3 = new Card("spades", 5)
card4 = new Card("diamonds", 5)
card5 = new Card("spades", "king")
const commonCards = [card1, card2, card3, card4, card5];

player1card1 = new Card("spades", "king")
player1card2 = new Card("hearts", 8)
player2card1 = new Card("diamonds", 6)
player2card2 = new Card("hearts", 3)

player1.setCards(player1card1, player1card2);
player2.setCards(player2card1, player2card2);
evaluateHand(player1, commonCards.concat(player1.cards));
evaluateHand(player2, commonCards.concat(player2.cards));

let player1Cards = player1.rankCards.map(x=>x);
let player2Cards = player2.rankCards.map(x=>x);
var winner = evaluateHighCards(player1Cards, player2Cards)
evaluateWinner(player1, player2) // player1 should win