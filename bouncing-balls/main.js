const counter = document.querySelector('p');
let ballCount = 0; // variable to keep count
count = document.createTextNode(`${ballCount}`); // text to display count
counter.appendChild(count);

// Update displayed count 
function updateCounter (){
  counter.childNodes[1].textContent = `${ballCount}`;
}

function dot (list1, list2){
  result = 0;
  list1.forEach((elt, index) =>{
    result += elt * list2[index];
  })
  return result
}

function add (list1, list2){
  result = [];
  list1.forEach((elt, index) =>{
    result.push(elt + list2[index]);
  })
  return result
}

function scale (scalar, list){
  return list.map(x => x*scalar)
}

function length(list){
  return Math.sqrt(dot(list, list));
}

// setup canvas
const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

const width = canvas.width = window.innerWidth;
const height = canvas.height = window.innerHeight;

// function to generate random number
function random(min, max) {
  const num = Math.floor(Math.random() * (max - min + 1)) + min;
  return num;
}

// function to generate random color
function randomRGB() {
  return `rgb(${random(0, 255)},${random(0, 255)},${random(0, 255)})`;
}

class Shape {
  constructor(x, y, velX, velY) {
    this.x = x;
    this.y = y;
    this.velX = velX;
    this.velY = velY;
  }
}

class Ball extends Shape {
    constructor(x, y, velX, velY, color, size) {
      super(x, y, velX, velY);
      this.color = color;
      this.size = size;
      this.exists = true;
      this.status = "moving";
    }

    // draw ball at current position
    draw() {
        ctx.beginPath();
        ctx.fillStyle = this.color;
        ctx.arc(this.x, this.y, this.size, 0, 2 * Math.PI);
        ctx.fill();
    }

    // move ball to new position according to velocity, 
    // if proceeding with current velocity will go beyond borders, reverse velocity before moving
    update() {
        if ((this.x + this.size) >= width) {
          this.velX = -(this.velX);
        }
      
        if ((this.x - this.size) <= 0) {
          this.velX = -(this.velX);
        }
      
        if ((this.y + this.size) >= height) {
          this.velY = -(this.velY);
        }
      
        if ((this.y - this.size) <= 0) {
          this.velY = -(this.velY);
        }
      
        this.x += this.velX;
        this.y += this.velY;
    }

    // if collide, change color and velocity
    collisionDetect() {
      for (const ball of balls) {
        if (this !== ball && ball.exists) {
          const dx = ball.x - this.x;
          const dy = ball.y - this.y;
          const distance = Math.sqrt(dx ** 2 + dy ** 2);

          // If still in colliding mode and still colliding, don't change speed
          // If still in colliding mode but no longer colliding, change to moving mode
          if (this.status === "colliding" && ball.status === "colliding" && distance > this.size + ball.size) {
            this.status = "moving";
            ball.status = "moving";
          // If not in colliding mode but is colliding, change speed and color
          } else if (this.status !== "colliding" && ball.status !== "colliding"  && distance <= this.size + ball.size) {
            ball.color = this.color = randomRGB();

            let norm = [dx, dy]; // vector normal to collision surface
            let unitNorm = scale(1/length(norm), norm);
            let tangent = [-dy, dx]; // vector tangent to collision surface
            let unitTan = scale(1/length(tangent), tangent);
            
            let thisVel = [this.velX, this.velY];//Math.sqrt(this.velX ** 2 + this.velY ** 2);
            let thisVelTan = dot(thisVel, unitTan); // this velocity value projected in tangent direction
            let thisVelNorm = dot(thisVel, unitNorm); // this velocity value projected in norm direction

            let ballVel = [ball.velX, ball.velY];//Math.sqrt(ball.velX ** 2 + ball.velY ** 2);
            let ballVelTan = dot(ballVel, unitTan); // ball velocity value projected in tangent direction
            let ballVelNorm = dot(ballVel, unitNorm); // ball velocity value projected in norm direction

            // Compute 1D collision in norm direction
            let thisVelNormFinal = (this.size-ball.size)/(this.size+ball.size) * thisVelNorm + 
                                    2*ball.size/(this.size+ball.size) * ballVelNorm;

            let ballVelNormFinal = (this.size-ball.size)/(this.size+ball.size) * ballVelNorm + 
                                    2*this.size/(this.size+ball.size) * thisVelNorm

            // Compute 2D velocity
            thisVel = add(scale(thisVelNormFinal, unitNorm), scale(thisVelTan, unitTan));
            ballVel = add(scale(ballVelNormFinal, unitNorm), scale(ballVelTan, unitTan));

            this.velX = thisVel[0];
            this.velY = thisVel[1];
            ball.velX = ballVel[0];
            ball.velY = ballVel[1];

            this.status = "colliding";
            ball.status = "colliding";
          }
        }
    

      }
    }
      
  }

class EvilCircle extends Shape {
  constructor(x, y) {
    super(x, y, 20, 20);
    this.color = "white";
    this.size = 10;
      // User control EvilCircle
    window.addEventListener("keydown", (e) => {
      switch (e.key) {
        case "a":
          this.x -= this.velX;
          break;
        case "d":
          this.x += this.velX;
          break;
        case "w":
          this.y -= this.velY;
          break;
        case "s":
          this.y += this.velY;
          break;
      }
    });
  }

  draw() {
    ctx.beginPath();
    ctx.strokeStyle = this.color;
    ctx.arc(this.x, this.y, this.size, 0, 2 * Math.PI);
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  checkBounds() {
    if ((this.x + this.size) >= width) {
      this.x -= this.size;
    }
  
    if ((this.x - this.size) <= 0) {
      this.x += this.size;
    }
  
    if ((this.y + this.size) >= height) {
      this.y -= this.size;
    }
  
    if ((this.y - this.size) <= 0) {
      this.y += this.size;
    }
  }

  collisionDetect() {
    for (const ball of balls) {
      if (ball.exists) {
        const dx = this.x - ball.x;
        const dy = this.y - ball.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
  
        if (distance < this.size + ball.size) {
          ball.exists = false;
          ballCount --;
          updateCounter();
        }
      }
    }
  }

}


// Construct balls
const balls = []; 
const evil = new EvilCircle(50, 50);
while (balls.length < 25) { 
  const size = random(15, 20);
  const ball = new Ball(
    // ball position always drawn at least one ball width
    // away from the edge of the canvas, to avoid drawing errors
    random(0 + size, width - size),
    random(0 + size, height - size),
    random(-7, 7),
    random(-7, 7),
    randomRGB(),
    size
  );

  balls.push(ball);

  ballCount ++;
  updateCounter();
}


// Animate balls
function loop() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
    ctx.fillRect(0, 0, width, height);
  
    for (const ball of balls) {
      if (ball.exists){
        ball.draw();
        ball.update();
        ball.collisionDetect();
      }
    }
    
    evil.draw();
    evil.checkBounds();
    evil.collisionDetect();
    
    requestAnimationFrame(loop);
}

loop();

  

  