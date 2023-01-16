# 22-23 Winter Hackathon

- `bouncing-balls`: Bouncing balls web simulation with self-implemented physics
- `compound-interest`: Compount Interest Calculator
- `poker`: Texas hold'em poker game (currently single-player only)

## Bouncing balls
25 balls of random size, color, velocity are created. Use `AWSD` to move the Evilball (transparent with white border) and eat the other balls. A total ball count is kept on the upper right corner of the page. 

P.S. When two balls collide, they bounce off each other and both change to another random color. 

## Compound interest calculator
Calculator with 4 input fields: primary amount, interest rate, time cycle, final amount. Given any 3 of the 4 fields, the calculator can compute the remaining field. More detailed instructions are given on the webpage. 

## Online two-player Poker (Playable)
```
http://hackathon.gloopen.com:3000/
```
- Completed 
  - Single-player:
    - Card flips
    - Table Setup
    - Token Movement
    - Evaluate poker hand ranking
    - Animate Token Movement
  - Two-player:
    - Take turns acting in one round
    - Setup server
    - Compare evaluations and declare winner
    - Move tokens to winner
    - Fold mechanism
    - End game early whenever all other players folded
    - Automatic flip cards back after player action (make bet or fold)
    - Match mechanism (simplified rules)
    - Initiate new game after game ends
    - Split tokens evenly for ties
  - Multiplayer and multirounds: 
    - Initialize new game and rotate player order
    - Decide which cards to flip on client side
    - Bet: subtract player.money after bet, reset player.betvalue after new round
    - Fold: fixed loop issue by setting one-time listener on server side, but still not sure why client keeps firing fold event
    - Next game: reset round, client click collect / clear token button then click ready for next game, add player money after collect tokens
    - Message: display result (congrats winner and say if winning due to folds), remind players to start new game, record current round number, record highest bet value per round
    - Username: displayed at top of page
    - Log users: display all players currently still in game on page
    - Start game: game starts once any player presses start
    - Reset game: game restarts once any player presses restart
- Woking on
  - Exchange tokens
  - Reposition start button
  - BUG: incorrect evaluation of two "None" ranks (rankCards should be empty, highCards should be full)
  - NEW: Break ties with more than 2 players
- What happens if player disconnects
  - During game, player that disconnects and reconnects with same name should be able to rejoin game with same socket?
  - Pause game if someone disconnects, save game session info, reload game once reconnect
  - Notify someone has disconnected, press reset button to reset new game
- Online multi-user version with Socket.io
  - Client's ability:
    - Flip own cards and select own tokens whenever they want
    - Make bet and animate token movement to common table
    - Collect tokens and animate token movement to player table (not done)
    - Store card objects
    - Has player as a global variable
  - Server's ability:
    - Deal cards to all players and common table
    - Decide whose turn to play (i.e. next button)
    - Update common table status to all players
    - Store card as array [suit, value]
    - Save list of loggedplayers, list of sockets
- To be completed
  - Multirounds: big bind, small bind (not done)
  - Refine multiple token movement (animate different target positions), adjust delay (not essential)
  - Reorganize token after collection (not essential)