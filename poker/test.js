
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