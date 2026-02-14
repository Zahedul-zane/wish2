const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
document.body.style.backgroundColor = "black"; // Force dark theme

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    reset();
});

let branches = [];
let particles = [];
let stars = [];

class Star {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = 0.5 + Math.random() * 1.5;
        this.length = 8 + Math.random() * 12;
        this.speedY = 2 + Math.random() * 6;
        this.speedX = (Math.random() - 0.5) * 0.5; // slight drift
        this.opacity = 0.2 + Math.random() * 0.8;
    }
    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        // recycle when out of view
        if (this.y > canvas.height + this.length) {
            this.y = -10 - Math.random() * 100;
            this.x = Math.random() * canvas.width;
            this.speedY = 2 + Math.random() * 6;
            this.length = 8 + Math.random() * 12;
            this.opacity = 0.2 + Math.random() * 0.8;
        }
        if (this.x < -50) this.x = canvas.width + 50;
        if (this.x > canvas.width + 50) this.x = -50;
    }

    draw() {
        ctx.save();
        ctx.strokeStyle = `rgba(200,220,255, ${this.opacity})`;
        ctx.lineWidth = this.size;
        ctx.beginPath();
        // draw a short slanted line to simulate falling streak
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x - this.speedX * this.length * 0.3, this.y - this.length);
        ctx.stroke();
        ctx.restore();
    }
}

// initial stars will be created in reset()

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 3 + 1;
        this.speedX = Math.random() * 2 - 1;
        this.speedY = Math.random() * 2 - 1;
        this.color = color;
        this.life = 60;
        this.opacity = 1;
    }
    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.life--;
        this.opacity = this.life / 60;
        this.size *= 0.95;
    }
    draw() {
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

function drawFrangipani(x, y, size, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.shadowBlur = 15;
    ctx.shadowColor = color;
    
    // Frangipani has 5 distinct petals in a spiral
    const petalCount = 5;
    const angleStep = (Math.PI * 2) / petalCount;
    
    // Rotate entire flower slowly
    ctx.rotate(Date.now() * 0.0005);

    for (let i = 0; i < petalCount; i++) {
        ctx.save();
        ctx.rotate(i * angleStep);
        
        // Gradient for petal (White -> Yellow or Pink -> Orange)
        // We'll simulate this with a radial gradient relative to the petal
        /* 
           Simple drawing: 
           One side of the petal overlaps the previous one.
           Shape is roughly oval/egg but skewed.
        */
        
        ctx.beginPath();
        // Petal shape
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(size * 0.5, -size * 0.2, size, -size * 0.5); // Outer edge curve
        ctx.quadraticCurveTo(size * 0.8, -size * 0.8, 0, 0); // Inner edge (overlap)
        
        // Color
        // If color is white, we want yellow center. If pink, maybe orange center.
        const gradient = ctx.createRadialGradient(0, 0, size * 0.1, size * 0.5, -size * 0.5, size);
        if (color === '#ffffff') {
            gradient.addColorStop(0, '#ffd700'); // Gold Center
            gradient.addColorStop(0.4, '#ffffff'); // White Body
            gradient.addColorStop(1, '#f0f0f0'); // Tip
        } else {
             gradient.addColorStop(0, '#ffcc00'); // Yellow/Orange Center
             gradient.addColorStop(0.5, color); // Main Color
             gradient.addColorStop(1, color); 
        }
        
        ctx.fillStyle = gradient;
        ctx.shadowBlur = 5; // Less blur on individual petals
        
        // Draw petal
        ctx.beginPath();
        ctx.ellipse(size/2, 0, size/2, size/4, -0.2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
    
    ctx.restore();
}

class Branch {
    constructor(x, y, angle, length, width, depth, color) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.length = 0;
        this.maxLength = length;
        this.width = width;
        this.depth = depth;
        this.color = color;
        this.growthSpeed = 2; 
        this.finished = false;
        this.children = [];
        this.hasFlower = false;
        this.flowerSize = 0;
        this.flowerSize = 0;
        this.maxFlowerSize = (10 - depth) * 6 + 35; // Massive flowers
        // Frangipani colors: White, Pink, Red, Cyan (Yellow removed)
        const colors = ['#ffffff', '#ff69b4', '#ff0000', '#00ffff'];
        this.flowerColor = colors[Math.floor(Math.random() * colors.length)];
    }

    update() {
        if (this.length < this.maxLength) {
            // Eased growth: slows down as it reaches full length
            // Delta is distance remaining * factor
            let growth = (this.maxLength - this.length) * 0.05;
            if (growth < 0.1) growth = 0.1; // Minimum speed
            this.length += growth;
        } else if (!this.finished) {
            this.finished = true;
            if (this.depth > 0) {
                // Single stem - no branching, just continuation
                const numBranches = 1; 
                for(let i=0; i<numBranches; i++) {
                    const angleOffset = (Math.random() * 20 - 10); // Slight natural wave
                    const newAngle = this.angle + angleOffset; 
                    const newLength = this.maxLength * 0.95; // Decay less to reach higher
                    const newWidth = this.width * 0.85;
                    this.children.push(new Branch(
                        this.x + Math.cos(this.angle * Math.PI/180) * this.maxLength,
                        this.y + Math.sin(this.angle * Math.PI/180) * this.maxLength,
                        newAngle, newLength, newWidth, this.depth - 1, this.color
                    ));
                }
            } else {
                this.hasFlower = true;
            }
        }

        if (this.hasFlower && this.flowerSize < this.maxFlowerSize) {
            this.flowerSize += (this.maxFlowerSize - this.flowerSize) * 0.03; // Eased flower growth
        }

        this.children.forEach(child => child.update());
    }

    draw() {
        // Calculate Sway
        // Time factor + Depth offset for wave effect
        const swayAmount = 2; 
        const timeParams = Date.now() * 0.001;
        // Sway depends on depth (higher branches sway more)
        // We add a sway offset to the current angle for drawing ONLY
        const swayOffset = Math.sin(timeParams + this.depth) * swayAmount * (10 - this.depth) * 0.1;
        
        const effectiveAngle = this.angle + swayOffset;

        const endX = this.x + Math.cos(effectiveAngle * Math.PI/180) * this.length;
        const endY = this.y + Math.sin(effectiveAngle * Math.PI/180) * this.length;
        
        // Update children's start position to match this end position
        // This is tricky in recursion without updating state. 
        // Ideally we should calculate positions in update() for physics.
        // But for visual sway, we can just "propagate" the start position if we redraw recursively.
        // HOWEVER, `this.children` are separate objects with their own X/Y. 
        // If we sway the parent, children X/Y need to move.
        // We need to update children positions in draw or update loop.
        
        // Correct approach for swaying tree:
        // Update children positions based on parent's new end tip.
        if (this.children.length > 0) {
            this.children.forEach(child => {
                child.x = endX;
                child.y = endY;
            });
        }

        ctx.beginPath();
        // Frangipani stems are greyish-green or brown, thick
        // Re-enabled stem drawing
        ctx.strokeStyle = '#6b8e23'; // Olive Drab
        ctx.lineWidth = this.width;
        ctx.lineCap = 'round';
        ctx.shadowBlur = 5;
        ctx.shadowColor = '#556b2f';
        ctx.moveTo(this.x, this.y);
        ctx.quadraticCurveTo(this.x, this.y - this.length/2, endX, endY); // Slight curve
        ctx.stroke();
        
        // Large Leaves at the end of branches (before flower)
        // Frangipani leaves are long, oval, and clustered
        // Re-enabled Leaves
        if (this.length > this.maxLength * 0.8) {
            const numLeaves = 3;
            for(let i=0; i<numLeaves; i++) {
                const leafAngle = this.angle + 120 * i; // Spread around
                const leafLen = 20 + Math.random() * 10;
                
                ctx.save();
                ctx.translate(endX, endY);
                ctx.rotate(leafAngle * Math.PI/180);
                
                ctx.beginPath();
                ctx.fillStyle = "#228B22";
                // Long leaf shape
                ctx.ellipse(leafLen/2, 0, leafLen/2, leafLen/6, 0, 0, Math.PI*2);
                ctx.fill();
                
                // Vein
                ctx.beginPath();
                ctx.strokeStyle = "#32CD32";
                ctx.lineWidth = 1;
                ctx.moveTo(0, 0);
                ctx.lineTo(leafLen, 0);
                ctx.stroke();
                
                ctx.restore();
            }
        }

        this.children.forEach(child => child.draw());

        if (this.hasFlower) {
            // Draw single flower for clean bouquet look
            drawFrangipani(endX, endY, this.flowerSize, this.flowerColor);
            
            // Random particles
            if (Math.random() < 0.05) {
                particles.push(new Particle(endX, endY, this.flowerColor));
            }
        }
    }
}

function reset() {
    branches = [];
    particles = [];
    stars = [];
    // Create raindrops
    for (let i = 0; i < 300; i++) stars.push(new Star());
    // 30 Flowers growing from bottom center
    for(let i=0; i<30; i++) {
        // Fan out angles: from -160 to -20 degrees
        // -90 is straight up.
        const angle = -160 + (Math.random() * 140); 
        const length = canvas.height * (0.4 + Math.random() * 0.3); // Random height
        branches.push(new Branch(canvas.width / 2, canvas.height, angle, length, 8, 0, '#006400'));
    }
}

reset();

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Update and draw raindrops
    stars.forEach(s => { s.update(); s.draw(); });
    
    branches.forEach(branch => {
        branch.update();
        branch.draw();
    });
    
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        particles[i].draw();
        if (particles[i].life <= 0) particles.splice(i, 1);
    }
    
    requestAnimationFrame(animate);
}

animate();

// Click to plant a new rose bush
window.addEventListener('click', (e) => {
    // Spawn flower at click position (single stem)
    branches.push(new Branch(e.clientX, e.clientY, -90, 50, 4, 0, '#006400'));
});
