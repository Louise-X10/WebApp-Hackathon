# 22-23 Winter Hackathon

- `bouncing-balls`: Bouncing balls web simulation with self-implemented physics
- `compound-interest`: Compount Interest Calculator
- `poker`: Texas hold'em poker game (currently single-player only)

## Bouncing balls
25 balls of random size, color, velocity are created. Use `AWSD` to move the Evilball (transparent with white border) and eat the other balls. A total ball count is kept on the upper right corner of the page. 

P.S. When two balls collide, they bounce off each other and both change to another random color. 

## Compound interest calculator
Calculator with 4 input fields: primary amount, interest rate, time cycle, final amount. Given any 3 of the 4 fields, the calculator can compute the remaining field. More detailed instructions are given on the webpage. 

## Poker (In progress)
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
- Woking on
  - start next round
- Online multi-user version with Socket.io
  - Client's ability:
    - Flip own cards and select own tokens whenever they want
    - Make bet and animate token movement to common table
    - Collect tokens and animate token movement to player table (not done)
  - Server's ability:
    - Deal cards to all players and common table
    - Decide whose turn to play (i.e. next button)
    - Update common table status to all players
- To be completed
  - Multiplayer: big bind, small bind
  - Refine multiple token movement (animate different target positions), adjust delay (not essential)
  - Reorganize token after collection (not essential)