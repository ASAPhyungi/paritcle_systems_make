let rods = [];
let systems = [];
let lightnings = [];

function setup() {
  createCanvas(800, 600);
  
  // Create a cityscape of lightning rods
  let numRods = 15;
  let spacing = width / numRods;
  
  for (let i = 0; i < numRods; i++) {
    // Random heights for buildings
    let h = random(100, 400);
    // Add some randomness to x position, but keep them roughly grid-aligned
    let x = i * spacing + spacing / 2 + random(-10, 10);
    rods.push(new LightningRod(x, height, h));
  }
}

function draw() {
  background(20, 20, 25); // Dark background

  // Draw the rods (buildings)
  for (let r of rods) {
    r.display();
  }

  // Draw and update lightning bolts
  for (let i = lightnings.length - 1; i >= 0; i--) {
    lightnings[i].update();
    lightnings[i].display();
    if (lightnings[i].isFinished()) {
      lightnings.splice(i, 1);
    }
  }

  // Draw and update particle systems (sparks)
  for (let i = systems.length - 1; i >= 0; i--) {
    systems[i].run();
    if (systems[i].particles.length === 0) {
      systems.splice(i, 1);
    }
  }
}

function mousePressed() {
  // Find the rod closest to the mouse x position
  let closestRod = null;
  let minDist = Infinity;

  for (let r of rods) {
    let d = abs(mouseX - r.pos.x);
    if (d < minDist) {
      minDist = d;
      closestRod = r;
    }
  }

  if (closestRod) {
    // 1. Create Lightning
    let startX = mouseX + random(-50, 50); // Originating from sky near mouse
    let startY = 0;
    lightnings.push(new LightningBolt(startX, startY, closestRod.tip.x, closestRod.tip.y));

    // 2. Create Particle Explosion (Sparks) at the tip
    systems.push(new ParticleSystem(closestRod.tip));
    
    // Add a flash effect to background (subtle)
    background(50, 50, 60);
  }
}

// --- Classes ---

class LightningRod {
  constructor(x, y, h) {
    this.pos = createVector(x, y);
    this.h = h;
    this.w = random(30, 60); // Building width
    this.tip = createVector(x, y - h); // The tip of the rod
  }

  display() {
    noStroke();
    
    // Building Body
    fill(40);
    rectMode(CENTER);
    rect(this.pos.x, this.pos.y - this.h / 2, this.w, this.h);
    
    // Windows (decoration)
    fill(20);
    let rows = this.h / 20;
    for(let i=0; i<rows-2; i++) {
        rect(this.pos.x, (this.pos.y - this.h) + 30 + (i*20), this.w * 0.4, 10);
    }

    // The Rod (Pointy top)
    fill(100); // Grey metallic
    beginShape();
    vertex(this.pos.x - 5, this.pos.y - this.h);
    vertex(this.pos.x + 5, this.pos.y - this.h);
    vertex(this.pos.x, this.pos.y - this.h - 40); // Sharp tip
    endShape(CLOSE);
    
    // Actual tip update for collision/targeting
    this.tip = createVector(this.pos.x, this.pos.y - this.h - 40);
  }
}

class LightningBolt {
  constructor(x1, y1, x2, y2) {
    this.segments = [];
    this.life = 10; // Frames the lightning is visible
    this.generate(x1, y1, x2, y2);
  }

  generate(x1, y1, x2, y2) {
    this.segments = [];
    let currentX = x1;
    let currentY = y1;
    let steps = 20;
    let dx = (x2 - x1) / steps;
    let dy = (y2 - y1) / steps;

    this.segments.push(createVector(currentX, currentY));

    for (let i = 0; i < steps - 1; i++) {
      currentX += dx;
      currentY += dy;
      
      // Add jaggedness
      let offset = random(-30, 30);
      this.segments.push(createVector(currentX + offset, currentY));
    }
    
    this.segments.push(createVector(x2, y2));
  }

  update() {
    this.life--;
  }

  isFinished() {
    return this.life < 0;
  }

  display() {
    let alpha = map(this.life, 0, 10, 0, 255);
    
    noFill();
    // Glow effect
    strokeWeight(6);
    stroke(100, 100, 255, alpha * 0.3);
    beginShape();
    for (let v of this.segments) vertex(v.x, v.y);
    endShape();

    // Main bolt
    strokeWeight(2);
    stroke(220, 240, 255, alpha);
    beginShape();
    for (let v of this.segments) vertex(v.x, v.y);
    endShape();
  }
}

// --- Particle System based on Nature of Code ---

class ParticleSystem {
  constructor(position) {
    this.origin = position.copy();
    this.particles = [];
    // Create an initial burst of particles
    for (let i = 0; i < 40; i++) {
      this.addParticle();
    }
  }

  addParticle() {
    this.particles.push(new Particle(this.origin));
  }

  run() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      let p = this.particles[i];
      p.run();
      if (p.isDead()) {
        this.particles.splice(i, 1);
      }
    }
  }
}

class Particle {
  constructor(position) {
    this.pos = position.copy();
    // Intense, random velocity for spark effect
    this.vel = p5.Vector.random2D();
    this.vel.mult(random(2, 12)); 
    // Upward bias slightly (bouncing off the tip)
    this.vel.y -= random(2, 5); 
    
    this.acc = createVector(0, 0.4); // Gravity
    this.lifespan = 255;
    this.decay = random(5, 15); // How fast it fades
  }

  run() {
    this.update();
    this.display();
  }

  update() {
    this.vel.add(this.acc);
    this.pos.add(this.vel);
    this.vel.mult(0.9); // Air resistance/drag to make sparks stop quickly
    this.lifespan -= this.decay;
  }

  display() {
    noStroke();
    // Spark color: White -> Yellow -> Orange -> Transparent
    let r = 255;
    let g = map(this.lifespan, 0, 255, 100, 255);
    let b = map(this.lifespan, 0, 255, 0, 200);
    
    fill(r, g, b, this.lifespan);
    
    // Scale size based on velocity (motion blur stretch)
    let size = map(this.lifespan, 0, 255, 2, 6);
    ellipse(this.pos.x, this.pos.y, size, size);
  }

  isDead() {
    return this.lifespan < 0;
  }
}