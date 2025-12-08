function setup() {
  createCanvas(800, 600);
  
  // Define the system properties
  system = new ParticleSystem();
}

function draw() {
  background(20, 20, 30);
  
  // Update and display the system
  system.run();
}

class ParticleSystem {
  constructor() {
    this.particles = [];
    
    // Configuration
    this.targetPos = createVector(width * 0.75, height / 2);
    this.targetRadius = 80;
    
    this.sourcePos = createVector(width * 0.25, height / 2);
    this.sourceRadius = 40;
    
    this.initParticles();
    
    // To manage the sequence of release
    this.releaseIndex = 0;
    this.releaseSpeed = 3; // How many particles release per frame
    this.isResetting = false;
    this.resetTimer = 0;
  }

  initParticles() {
    this.particles = [];
    let spacing = 3; // Density of particles
    
    // Create particles in a grid, keep those inside the source radius
    for (let x = this.sourcePos.x - this.sourceRadius; x <= this.sourcePos.x + this.sourceRadius; x += spacing) {
      for (let y = this.sourcePos.y - this.sourceRadius; y <= this.sourcePos.y + this.sourceRadius; y += spacing) {
        if (dist(x, y, this.sourcePos.x, this.sourcePos.y) <= this.sourceRadius) {
          this.particles.push(new Particle(x, y));
        }
      }
    }
    
    // SORTING ALGORITHM: 
    // This creates the effect of "breaking from the side closest to the big circle".
    // We sort the array based on the distance to the target.
    this.particles.sort((a, b) => {
      let d1 = p5.Vector.dist(a.pos, this.targetPos);
      let d2 = p5.Vector.dist(b.pos, this.targetPos);
      return d1 - d2; // Ascending order: closest particles are at the beginning of the array
    });
  }

  run() {
    // 1. Draw Target Circle (The Absorber)
    noStroke();
    
    // Glow effect
    for(let i = 0; i < 5; i++) {
        fill(255, 100, 150, 10 - i*2);
        ellipse(this.targetPos.x, this.targetPos.y, this.targetRadius * 2 + i*20);
    }
    
    fill(200, 50, 100);
    ellipse(this.targetPos.x, this.targetPos.y, this.targetRadius * 2);
    
    // 2. Manage Release Logic
    if (this.releaseIndex < this.particles.length) {
      let limit = min(this.releaseIndex + this.releaseSpeed, this.particles.length);
      for (let i = this.releaseIndex; i < limit; i++) {
        this.particles[i].release();
      }
      this.releaseIndex = limit;
    }

    // 3. Update and Draw Particles
    // We iterate backwards to allow removal
    let activeCount = 0;
    
    for (let i = this.particles.length - 1; i >= 0; i--) {
      let p = this.particles[i];
      
      if (p.isReleased) {
        // Nature of Code: Attraction Force
        let force = this.calculateAttraction(p);
        p.applyForce(force);
        p.update();
        
        // Check for absorption
        let d = p5.Vector.dist(p.pos, this.targetPos);
        if (d < this.targetRadius * 0.8) {
             this.particles.splice(i, 1); // Remove particle (Absorbed)
             // Optional: Make target pulse slightly on impact
             continue; 
        }
      } else {
        // Jitter effect for particles about to be released
        p.jitter();
        activeCount++;
      }
      
      p.show();
    }
    
    // 4. Auto Reset logic
    if (this.particles.length === 0) {
        this.resetTimer++;
        if(this.resetTimer > 60) {
            this.initParticles();
            this.releaseIndex = 0;
            this.resetTimer = 0;
        }
    }
  }
  
  calculateAttraction(p) {
    // F = G * (m1 * m2) / r^2
    // Simplified direction and magnitude
    let force = p5.Vector.sub(this.targetPos, p.pos);
    let distance = force.mag();
    distance = constrain(distance, 5, 500); // Constrain distance to avoid extreme forces
    
    force.normalize();
    let strength = 200 / (distance * distance); // Strength constant
    
    // Increase strength as it gets very close to ensure it sucks in
    if(distance < 100) strength *= 4; 
    
    force.mult(strength * 15);
    return force;
  }
}

class Particle {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.origPos = createVector(x, y);
    this.vel = createVector(0, 0);
    this.acc = createVector(0, 0);
    this.isReleased = false;
    this.color = color(100, 200, 255);
    this.maxSpeed = 8;
  }
  
  release() {
    this.isReleased = true;
    // Give a tiny initial push towards target or random to simulate explosion/crumbling
    this.vel = p5.Vector.random2D().mult(0.5);
  }
  
  jitter() {
      // Create a vibrating effect before releasing
      this.pos.x = this.origPos.x + random(-0.5, 0.5);
      this.pos.y = this.origPos.y + random(-0.5, 0.5);
  }

  applyForce(force) {
    this.acc.add(force);
  }

  update() {
    this.vel.add(this.acc);
    this.vel.limit(this.maxSpeed);
    this.pos.add(this.vel);
    this.acc.mult(0); // Reset acceleration
  }

  show() {
    noStroke();
    if (this.isReleased) {
        // As it gets closer to being absorbed, maybe change color
        fill(255, 200, 255, 200);
        ellipse(this.pos.x, this.pos.y, 3, 3); // Slightly larger when moving
    } else {
        fill(this.color);
        ellipse(this.pos.x, this.pos.y, 2, 2);
    }
  }
}