const play_game = () => {
    class Player {
        constructor(x, y, radius, colour) {
            this.x = x;
            this.y = y;
            this.radius = radius;
            this.colour = colour;
        }

        draw() {
            ctx.beginPath();
            ctx.arc(canvas.width / 2, canvas.height / 2, this.radius, 0, 360);
            ctx.fillStyle = this.colour;
            ctx.fill();
        }
    }

    class Bullet {
        constructor(x, y, radius, colour, velocity) {
            this.x = x;
            this.y = y;
            this.radius = radius;
            this.colour = colour;
            this.velocity = velocity;
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, 360);
            ctx.fillStyle = this.colour;
            ctx.fill();
        }

        update() {
            this.draw();
            this.x += this.velocity.x;
            this.y += this.velocity.y;
        }
    }

    class Enemy {
        constructor(x, y, radius, colour, velocity) {
            this.x = x;
            this.y = y;
            this.radius = radius;
            this.colour = colour;
            this.velocity = velocity;
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, 360);
            ctx.fillStyle = this.colour;
            ctx.fill();
        }

        update() {
            this.draw();
            this.x += this.velocity.x;
            this.y += this.velocity.y;
        }
    }

    class Fragment {
        constructor(x, y, radius, colour, velocity) {
            this.x = x;
            this.y = y;
            this.radius = radius;
            this.colour = colour;
            this.velocity = velocity;
            this.alpha = 1;
        }

        draw() {
            ctx.save()
            ctx.globalAlpha = this.alpha;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, 360);
            ctx.fillStyle = this.colour;
            ctx.fill();
            ctx.restore();
        }

        update() {
            this.draw();
            this.velocity.x *= 0.95; // *= friction value
            this.velocity.y *= 0.95; // *= friction value
            this.x += this.velocity.x;
            this.y += this.velocity.y;
            this.alpha -= FRAGMENT_FADE_OUT_SPEED * 0.01;
        }
    }
    // KNOBS TO TWIDDLE:
    // Player 
    const PLAYER_SIZE = 20
    // Enemies
    const ENEMY_VELOCITY_START = 5;
    const ENEMY_SIZE_MIN = 20;
    const ENEMY_SIZE_MAX = 60;
    // Bullets
    const BULLET_VELOCITY = 10;
    const BULLET_SIZE = 7;
    // Explosion fragments
    const EXPLOSION_FRAGMENTS = 10;
    // const FRAGMENT_MAX_SIZE = 1.5;
    const FRAGMENT_MAX_SIZE = 5;
    const FRAGMENT_FADE_OUT_SPEED = 3; // 1 - 10
    const FRAGMENT_VELOCITY = 30;

    // ACTIVE GAME STUFF
    const canvas = document.querySelector('#game');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth * 0.8;
    canvas.height = window.innerHeight * 0.8;
    const bullets = [];
    const fragments = [];
    const enemies = [];
    let score = 0;
    const scoreboard = document.querySelector("#score");
    const mouse = {
        x: null,
        y: null
    };
    const player = new Player(canvas.width / 2, canvas.height / 2, PLAYER_SIZE, 'white');
    let currentFrame;
    let enemiesIntervalObject;
    const topscore = {
        "user": "Someone new",
        "score": 10,
        "time": "1624941250386"
    };

    const currentUser = {
        "user": "George Edwards",
        "score": score,
        "time": "1624941250386"
    };

    // track mouse position
    document.addEventListener('mousemove', event => {
        mouse.x = event.pageX;
        mouse.y = event.pageY;
    });

    const gameOver = () => {
        cancelAnimationFrame(currentFrame);
        clearInterval(enemiesIntervalObject);
        currentUser.score = score;
        document.querySelector('#yourscore').innerHTML = `${currentUser.score} : ${currentUser.user}`;
        if (currentUser.score > topscore.score) {
            document.querySelector('#highscore').innerHTML = `${currentUser.score} : ${currentUser.user}`;
        } else {
            document.querySelector('#highscore').innerHTML = `${topscore.score} : ${topscore.user}`;
        }
        // show modal
        document.querySelector('#game-over-modal').style.display = 'flex';
    }

    // spawn enemies
    const spawnEnemies = () => {
        enemiesIntervalObject = setInterval(() => {
            const radius = Math.random() * (ENEMY_SIZE_MAX - ENEMY_SIZE_MIN) + ENEMY_SIZE_MIN;
            let x;
            let y;
            if (Math.random() < 0.5) {
                x = Math.random() < 0.5 ? 0 - radius : canvas.width + radius;
                y = Math.random() * canvas.height;
            } else {
                x = Math.random() * canvas.width;
                y = Math.random() < 0.5 ? canvas.height - radius : canvas.height + radius;
            }
            const colour = `hsl(${Math.random() * 360}, 30%, 50%)`;
            const angle = Math.atan2(canvas.height / 2 - y, canvas.width / 2 - x); // angle to player
            // get currect score and increase difficulty if required.

            const velocity = {
                x: Math.cos(angle) * ENEMY_VELOCITY_START * (score / 1000 + 1),
                y: Math.sin(angle) * ENEMY_VELOCITY_START * (score / 1000 + 1)
            }
            enemies.push(new Enemy(x, y, radius, colour, velocity));
        }, 1000);
    }

    // spawn bullet
    // event = keyup or keydown
    document.addEventListener('keyup', event => {
        // console.log(event);
        if (event.key === 'Escape') {
            gameOver();
            return;
        }
        const angle = Math.atan2(mouse.y - canvas.height / 2, mouse.x - canvas.width / 2); // angle to mouse position
        const velocity = {
            x: Math.cos(angle) * BULLET_VELOCITY,
            y: Math.sin(angle) * BULLET_VELOCITY
        }
        bullets.push(new Bullet(innerWidth / 2, innerHeight / 2, BULLET_SIZE, 'white', velocity));
    })

    // process
    const step = () => {
        ctx.fillStyle = 'rgba(0,0,0, 0.3)'; // background
        ctx.fillRect(0, 0, canvas.width, canvas.height); // wipe screen from previous frame
        currentFrame = requestAnimationFrame(step); // step next frame
        player.draw();

        // process bullets
        bullets.forEach((bullet, index) => {
            bullet.update();
            // bullet leaves screen
            if (bullet.x - bullet.radius < 0 ||
                bullet.x - bullet.radius > canvas.width ||
                bullet.y - bullet.radius < 0 ||
                bullet.y - bullet.radius > canvas.height) {
                setTimeout(() => {
                    bullets.splice(index, 1);
                }, 0)
            }
        });

        // process enemies
        enemies.forEach((enemy, enemyIndex) => {
            enemy.update();
            const distanceFromPlayer = Math.hypot(enemy.x - player.x, enemy.y - player.y) - enemy.radius - player.radius;
            if (distanceFromPlayer <= 0) {
                gameOver();
            }
            bullets.forEach((bullet, bulletIndex) => {
                const distance = Math.hypot(bullet.x - enemy.x, bullet.y - enemy.y) - enemy.radius - bullet.radius;
                if (distance <= 0) { // bullet and enemy touch
                    bullets.splice(bulletIndex, 1); // remove bullet
                    score += 4;
                    scoreboard.innerHTML = score;
                    if (enemy.radius - 10 > ENEMY_SIZE_MIN) { // not dead so reduce size
                        gsap.to(enemy, {
                            duration: 0.25,
                            radius: enemy.radius - 10
                        })
                    } else { // enemy dead
                        setTimeout(() => { // avoid flicker by sending to end of event loop
                            for (let i = 0; i < EXPLOSION_FRAGMENTS; i++) {
                                fragments.push(new Fragment(
                                    enemy.x,
                                    enemy.y,
                                    Math.random() * FRAGMENT_MAX_SIZE,
                                    enemy.colour, {
                                        x: (Math.random() - 0.5) * Math.random() * FRAGMENT_VELOCITY,
                                        y: (Math.random() - 0.5) * Math.random() * FRAGMENT_VELOCITY
                                    }));
                            }
                            enemies.splice(enemyIndex, 1);
                        }, 0)
                    }
                }
            })
        });

        // process fragments
        fragments.forEach((fragment, index) => {
            if (fragment.alpha <= 0) {
                fragments.splice(index, 1);
            } else {
                fragment.update();
            }
        })
    }
    step();
    spawnEnemies();
}

play_game();