class ShootingScene extends Phaser.Scene {
    constructor() {
        super({ key: 'ShootingScene' });
    }

    preload() {
        this.load.image('player', 'assets/player.png'); // プレイヤーの画像
        this.load.image('allyBullet_s', 'assets/snowball_s.png'); // 弾の画像
        this.load.image('allyBullet_m', 'assets/snowball_m.png'); // 弾の画像
        this.load.image('allyBullet_l', 'assets/snowball_l.png'); // 弾の画像
        this.load.image('enemy', 'assets/enemy.png'); //暫定の敵の画像
        this.load.image('ally', 'assets/player.png'); // 暫定の味方の画像
        this.load.image('enemyBullet_s', 'assets/snowball_s.png'); // 敵の弾の画像
        this.load.image('enemyBullet_m', 'assets/snowball_m.png'); // 敵の弾の画像
        this.load.image('enemyBullet_l', 'assets/snowball_l.png'); // 敵の弾の画像
        this.load.image('sandalphon', 'assets/ally1.png'); // サンダルフォンの画像
        this.load.image('uriel', 'assets/ally2.png'); // ウリエルの画像
        this.load.image('gabriel', 'assets/ally3.png'); // ガブリエルの画像
        this.load.image('satan', 'assets/enemy.png'); // サタンの画像
        this.load.image('forneus', 'assets/enemy2.png'); // フォルネウスの画像
        this.load.image('amon', 'assets/enemy3.png'); // アモンの画像
        this.load.image('charge_1', 'assets/charge_1.png'); //チャージ中のアニメーション画像
        this.load.image('charge_2', 'assets/charge_2.png');
        this.load.image('charge_3', 'assets/charge_3.png');
        this.load.image('charge_4', 'assets/charge_4.png');
        this.load.image('snow_particle', 'assets/snow_particle.png'); //雪玉パーティクル
    }
    init(data) {

        this.data_ballAmount_m = 0;
        if (data && data.hasOwnProperty('ballAmount_m')) {
            this.data_ballAmount_s = data.ballAmount_s * 4;//注文に答えられた雪玉数の二倍をそれぞれに配る
            this.data_ballAmount_m = data.ballAmount_m * 3;//合計6倍の量になる 要調整
            this.data_ballAmount_l = data.ballAmount_l * 2;
        }
        
    }
    create() {

        // ゲームの画面サイズを設定（中央に配置するためのオフセットを使用）
        this.cameras.main.setViewport(48, 128, 504, 672);
        this.cameras.main.setZoom(0.84);
        this.cameras.main.setScroll(48, 64);

        //デバッグ用にtextを表示しておく 最終的にスコア表示にする
        this.text = this.add.text(10, 10, '', { font: '16px Courier', fill: '#000000' }).setVisible(false);

        // デバッグ用スコアの作成
        this.score = 0;
        this.player_damage = 0;
        this.ally_damage = 0;
        this.friendly_fire = 0;


        // プレイヤーを作成
        this.player = this.physics.add.sprite(300, 750, 'player').setImmovable();
        this.player.setCollideWorldBounds(true); // 画面端でプレイヤーの動きを制限
        this.player.body.setMaxVelocity(200, 10); // プレイヤーの速度上限を設定
        this.player.body.setSize(20, 20);
        this.player.lastFired = 0; // 最後に弾を発射した時間を記録
        this.player.stock = 0; //残弾数
        this.player.completion = 0; //弾の完成度
        this.player.isInvincible = false; //無敵状態オフ

        /*
        var particles = this.add.particles(0,0,'allyBullet_s',{
            speed: 100,
            scale: { start: 1, end: 0 },
            blendMode: 'ADD',
            emitZone: { type: 'edge', source: new Phaser.Geom.Circle(0, 0, 50), quantity: 30, yoyo: false }
        });

        // プレイヤーを中心にエミッターを移動
        particles.startFollow(this.player);
        */



        // チャージ用のアニメーションの作成
        /*this.anims.create({
            key: 'charging',
            frames: [
                { key: 'charge_1' },
                { key: 'charge_2' },
                { key: 'charge_3' },
                { key: 'charge_4' }
            ],
            frameRate: 10, // 1秒あたりのフレーム数
            repeat: -1 // アニメーションを無限に繰り返す
        });
        */
        // チャージアニメーション用のプレイヤー追従スプライトを作成
        //this.chargeEffect = this.add.sprite(this.player.x, this.player.y, 'charge_1').setVisible(false);

        // 雪玉集積地の初期設定

        this.snowStock = this.physics.add.sprite(300, 650, 'snowstock_1').setVisible(false); // 初期画像
        this.snowStock.stock = 0; //集積地の残弾数
        //集積数をRhythmSceneで作成した個数に
        //if (this.data_ballAmount) { this.snowStock.stock = this.data_ballAmount; }

        // 敵を管理するグループ
        this.enemies = this.physics.add.group();

        //敵の種類を定義
        const enemyTypes = [
            { name: 'satan', sprite: 'satan', speed: 400, pace: 1200, health: 5 },
            { name: 'forneus', sprite: 'forneus', speed: 600, pace: 600, health: 2 },
            { name: 'amon', sprite: 'amon', speed: 200, pace: 800, health: 3 }
        ];

        // 味方を管理するグループ
        this.allies = this.physics.add.group();
        //味方の種類を定義
        const allyTypes = [
            { name: 'sandalphon', sprite: 'sandalphon', speed: 400, pace: 400, health: 5 },
            { name: 'uriel', sprite: 'uriel', speed: 600, pace: 200, health: 2 },
            { name: 'gabriel', sprite: 'gabriel', speed: 200, pace: 700, health: 3 }
        ];

        //味方に対するtween雪玉のグループ
        this.tween_snowballGroups = new Map();

        // 敵を一度だけ生成
        this.createEnemy(300, 100, enemyTypes[0]); // 
        this.createEnemy(200, 50, enemyTypes[1]);
        this.createEnemy(400, 50, enemyTypes[2]);
        // 味方を一度だけ生成
        this.createAlly(300, 550, allyTypes[0]); // 
        this.createAlly(100, 600, allyTypes[1]); //
        this.createAlly(500, 600, allyTypes[2]); //

        // seを設定
        this.hit_se1 = this.sound.add('hit_se1', { volume: 0.3 });  // 音量を0.5に設定
        this.hit_se2 = this.sound.add('hit_se2',{ volume: 0.3});
        // 敵の弾を管理するグループ
        this.enemyBullets = this.physics.add.group({
            defaultKey: 'enemyBullet_m',
            maxSize: 50
        });

        // 弾を管理するグループを作成
        this.allyBullets = this.physics.add.group({
            defaultKey: 'allyBullet_m',
            maxSize: 50
        });

        // 衝突判定
        this.physics.add.collider(this.allyBullets, this.enemies, this.bulletHitEnemy, null, this);
        this.physics.add.collider(this.player, this.enemyBullets, this.enemyBulletHitPlayer, null, this);
        this.physics.add.collider(this.allies, this.enemyBullets, this.enemyBulletHitAlly, null, this)

        //フレンドリーファイアの衝突判定
        this.physics.add.collider(this.allyBullets, this.allies, this.bulletHitAlly, null, this);
        // 弾同士の相殺判定
        // this.physics.add.collider(this.allyBullets, this.enemyBullets, this.bulletCancel, null, this);

        // マウスクリックで移動&雪玉作成(弾を発射機能は削除)
        this.input.on('pointerdown', this.startHold, this);
        this.input.on('pointerup', this.stopHold, this);
        this.isHold = false;
        //this.input.on('pointerdown', () => this.fireBullet());

        //フレームUIとやり取りするイベントリスナー
        this.game.events.on('Timeup', this.Timeup, this);
        this.game.events.on('GameOver', this.GameOver, this);

        this.hit_effect = this.add.particles(0, 0, 'snow_particle', {
			rotate: { min: 0, max: 360 },
			lifespan: 300,
			scale: { start: 1, end: 0 },
			speed: { min: 150, max:300 },
            emitting: false,
		});


    }

    update() {
        // 画面外に出た弾を非表示にする
        this.handleBulletsOutOfBounds(this.allyBullets);
        this.handleBulletsOutOfBounds(this.enemyBullets);
        this.handleBulletsOutOfBounds(this.enemies);

        const p = this.input.activePointer;
        //constは定数, letは変数宣言

        this.enemies.children.iterate((enemy) => {
            if (enemy.name === 'satan') {
                //敵の移動転換と弾発射
                this.moveEnemy(enemy);
            } else if (enemy.name === 'forneus') {
                this.moveEnemy(enemy);
            } else if (enemy.name === 'amon') {
                this.moveEnemy(enemy);
            } else {
                //throw new Error("プログラムを強制終了");
            }

        });

        //味方が自動回避と射撃をする
        this.allies.children.iterate((ally) => {
            if (ally.name === 'sandalphon') {
                //敵の移動転換と弾発射
                this.avoidEnemyBullets(ally);
                this.fireAtEnemies(ally);
            } else if (ally.name === 'uriel') {
                this.avoidEnemyBullets(ally);
                this.fireAtEnemies(ally);
            } else if (ally.name === 'gabriel') {
                this.avoidEnemyBullets(ally);
                this.fireAtEnemies(ally);
            } else {
                //throw new Error("プログラムを強制終了");
            }

        });
        // プレイヤーが敵の弾を自動で避けるロジック
        //this.avoidEnemyBullets();

        // プレイヤーが敵に自動で弾を撃つロジック
        //this.fireAtEnemies();

        //プレイヤーがマウスに向かって移動するロジック
        this.chara_xmove(this.player, p.x);
        //プレイヤーが被弾時以外に雪玉を作成するロジック
        if (this.player.isInvincible == false) {
            if (this.isHold) {
                this.player.completion += 1; //雪玉作成ゲージ上昇
                if (this.player.completion >= 30) { // ゲージが100に達したら
                    this.player.stock += 1; // 残弾数を増やす
                    this.player.completion = 0; // ゲージをリセット
                }
            }
        }

        // エフェクトをプレイヤーに追従させる
        //this.chargeEffect.setPosition(this.player.x, this.player.y);

        // プレイヤーから集積地に残弾を移す処理
        /* 一旦停止しておく
        if (Phaser.Math.Distance.Between(this.player.x, this.player.y, this.snowStock.x, this.snowStock.y) < 150) {
            this.snowStock.stock += this.player.stock;
            this.player.stock = 0;
        }
        */

        // 集積地から味方に残弾を移す処理
        this.allies.children.iterate((ally) => {
            if (ally.stock == 0) {
                if (Phaser.Math.Distance.Between(ally.x, ally.y, this.snowStock.x, this.snowStock.y) < 150) {
                    if (this.snowStock.stock > 5) { // 一度に補充できる最大数は5つ
                        ally.stock += 5;
                        this.snowStock.stock -= 5;
                    } else {
                        ally.stock += this.snowStock.stock;
                        this.snowStock.stock = 0;
                    }
                }
            }
        });

        // 敵の残弾数を回復する処理(一旦ランダムな射撃待機時間を付けることで補給感を出す)
        this.enemies.children.iterate((enemy) => {
            if (enemy.stock == 0) {
                enemy.lastFired += Phaser.Math.Between(1000, 5000);;
                enemy.stock = 5;
            }
        });


        // 集積地のグラフィックを残弾数に応じて更新
        if (this.snowStock.stock < 5) {
            this.snowStock.setTexture('snowstock_1');
        } else if (this.snowStock.stock < 11) {
            this.snowStock.setTexture('snowstock_2');
        } else {
            this.snowStock.setTexture('snowstock_3');
        }

        // 特定の味方のオブジェクトを参照
        const test = this.allies.getChildren().find(ally => ally.name === 'uriel');

        //テキストで諸々の情報を出しておく
        this.text.setText([
            `マウスx: ${p.x}`,
            `マウスy: ${p.y}`,
            `長押し時間duration: ${Math.round(p.getDuration())}`,
            `自機速度velocity: ${Math.round(this.player.body.velocity.x)}`,
            `スコア: ${this.score}`,
            `マイナススコア: ${this.ally_damage}`,
            `誤射: ${this.friendly_fire}`,
            `被弾: ${this.player_damage}`,
            `残弾: ${this.player.stock}`,
            `作成度: ${this.player.completion}`,
            `集積数: ${this.snowStock.stock}`,
        ]);


        this.allies.getChildren().forEach((ally) => {
            let i = 0;
            const snowballs = this.tween_snowballGroups.get(ally);
            const numSnowballs = snowballs.getLength();
            snowballs.getChildren().forEach(snowball => {
                var angle = Phaser.Math.DegToRad(360 / numSnowballs * i++ + snowball.angle);
                snowball.x = ally.x + 50 * Math.cos(angle);
                snowball.y = ally.y + 50 * Math.sin(angle);
            });
        });
        


    }

    chara_xmove(obj, x) {
        //キャラクターを指定されたx座標に加速させ近づける
        const distance = x - obj.x;
        if (Math.abs(distance) > 20) {
            //マウスカーソルとプレイヤーのX座標の差が50より大きい場合に加速
            obj.body.setAccelerationX(600 * Math.sign(distance));
        } else if (Math.abs(distance) > 10) {
            //マウスカーソルとプレイヤーのX座標の差が20より大きく20より小さかったら速度に対して逆向きに加速(ブレーキ)
            obj.body.setAccelerationX(-600 * Math.sign(obj.body.velocity.x));
        } else {
            //マウスカーソルとプレイヤーのX座標の差が20より小さかったら静止するか判定処理に入る
            if (Math.abs(obj.body.velocity.x) < 30) {
                obj.body.setVelocityX(0);
                obj.body.setAccelerationX(0);
            }
        }
    }

    fireAtEnemies(ally) {
        if (ally.isInvincible) return;
        this.enemies.children.iterate((enemy) => {
            if (enemy.active) {
                // 敵がプレイヤーの射程範囲内にいる場合、弾を撃つ
                if (this.time.now > ally.lastFired + ally.pace && (ally.stock_s > 0 || ally.stock_m > 0 || ally.stock_l)) {
                    if(ally.name == 'gabriel'){
                        const sandalphonAlly = this.allies.getChildren().find(ally => ally.name === 'sandalphon');
                        if(Math.abs(sandalphonAlly.x - ally.x)>=100){
                            this.fireBullet(ally);
                        }
                    }else{
                        this.fireBullet(ally);
                    }
                    ally.lastFired = this.time.now;
                }
            }
        });
    }

    fireBullet(ally) {
        let totalStock = ally.stock_s + ally.stock_m + ally.stock_l;

        if (totalStock === 0) {
            console.log('No snowballs!');
            return;
        }

        // ランダムな敵に向けて発射

        // アクティブな敵のリストを作成
        const activeEnemies = this.enemies.getChildren().filter(enemy => enemy.active);
        if (activeEnemies.length > 0) {
            // ランダムに敵を一人選択
            const targetEnemy = Phaser.Math.RND.pick(activeEnemies);
            if (targetEnemy) {
                // プレイヤーの位置から選択された敵に向けて弾を発射
                const bullet = this.allyBullets.get(ally.x, ally.y - 20);
                if (bullet) {
                    bullet.setActive(true).setVisible(true);

                    // 持っている雪玉からランダムに選択
                    let randomIndex = Phaser.Math.RND.integerInRange(0, totalStock - 1);
                    let randomChoice;
                    if (randomIndex < ally.stock_s) {
                        randomChoice = 's';
                    } else if (randomIndex < ally.stock_s + ally.stock_m) {
                        randomChoice = 'm';
                    } else {
                        randomChoice = 'l';
                    }

                    switch (randomChoice) {
                        case 's':
                            ally.stock_s--;
                            bullet.damage = 1;
                            bullet.setTexture('allyBullet_s');
                            bullet.body.setSize(17,17);
                            this.physics.moveTo(bullet, targetEnemy.x, targetEnemy.y, 400);
                            break;
                        case 'm':
                            ally.stock_m--;
                            bullet.damage = 2;
                            bullet.setTexture('allyBullet_m');
                            bullet.body.setSize(33,33);
                            this.physics.moveTo(bullet, targetEnemy.x, targetEnemy.y, 200);
                            break;
                        case 'l':
                            ally.stock_l--;
                            bullet.y = ally.y - 40;
                            this.removeTweenSnowballFromAlly(ally);
                            bullet.damage = 4;
                            bullet.setTexture('allyBullet_l');
                            bullet.body.setSize(65,65);
                            this.physics.moveTo(bullet, targetEnemy.x, targetEnemy.y, 100);
                            break;
                    }
                }
            }
        }
    }

    createEnemy(x, y, type) {
        //指定したタイプと座標に敵を生成する
        const enemy = this.enemies.create(x, y, type.name);
        enemy.name = type.name;
        enemy.speed = type.speed;
        enemy.health = type.health;
        enemy.health_MAX = type.health;
        enemy.pace = type.pace;
        // その他の特性をここで設定...
        // enemy.body.acceleration.x = Phaser.Math.Between(-600, 600); // 初期の左右移動速度
        enemy.body.acceleration.x = type.speed;
        enemy.setActive(true).setVisible(true);
        enemy.setCollideWorldBounds(true); // 画面端での動きを制限
        enemy.body.setSize(10, 10);
        enemy.body.setMaxVelocity(enemy.speed, 0); // 速度上限を設定
        enemy.body.velocity.y = 0;
        enemy.lastFired = 0; // 最後に弾を発射した時間を記録
        enemy.lastSharked = this.time.now + 10000; //鮫発射時間も記録
        enemy.stock_s = 12; //残弾数を配列でなくそれぞれ違う名前で管理するのを許して欲しい
        enemy.stock_m = 7; //
        enemy.stock_l = 2; //

        enemy.nextChange = 0; // 次に方向転換する時間を記録
        enemy.isInvincible = false; //無敵判定をオフ
        enemy.setPushable(false); //衝突により移動しなくする
        return enemy;
    }

    createAlly(x, y, type) {
        //指定したタイプと座標に味方を生成する
        const ally = this.allies.create(x, y, type.name);
        ally.name = type.name;
        ally.speed = type.speed;
        ally.health = type.health;
        ally.health_MAX = type.health;
        ally.pace = type.pace;
        // その他の特性をここで設定...
        // enemy.body.acceleration.x = Phaser.Math.Between(-600, 600); // 初期の左右移動速度
        ally.body.acceleration.x = type.speed;
        ally.setActive(true).setVisible(true);
        ally.setCollideWorldBounds(true); // 画面端での動きを制限
        ally.body.setSize(1, 1);
        ally.body.setMaxVelocity(ally.speed, 0); // 速度上限を設定
        ally.body.velocity.y = 0;
        ally.lastFired = 0; // 最後に弾を発射した時間を記録
        ally.stock_s = this.data_ballAmount_s; //残弾数を配列でなくそれぞれ違う名前で管理するのを許して欲しい
        ally.stock_m = this.data_ballAmount_m; //
        ally.stock_l = this.data_ballAmount_l; //
        ally.nextChange = 0; // 次に方向転換する時間を記録
        ally.isInvincible = false; //無敵判定をオフ
        ally.setPushable(false); //衝突により移動しなくする


        // 各味方に対する所持雪玉を示すグループを作成
        
        ally.tween_snowballs = this.add.group();
        for (let i = 0; i < ally.stock_l; i++) {  // 各味方に5つの雪玉を追加
            var tween_snowball = this.add.sprite(ally.x, ally.y, 'allyBullet_s');
            ally.tween_snowballs.add(tween_snowball);
            this.tweens.add({
                targets: tween_snowball,
                angle: 360,
                ease: 'Linear',
                duration: 2000,
                repeat: -1,
                yoyo: false
            });
        }

        // Mapに ally とその雪玉グループを追加
        this.tween_snowballGroups.set(ally, ally.tween_snowballs);

        return ally;
    }

    addTweenSnowballToAlly(ally) {
        var snowballs = this.tween_snowballGroups.get(ally);
        if (!snowballs) {
            snowballs = this.add.group();
            this.tween_snowballGroups.set(ally, snowballs);
        }
        var snowball = this.add.sprite(ally.x, ally.y, 'allyBullet_s');
        snowballs.add(snowball);
        this.tweens.add({
            targets: snowball,
            angle: 360,
            ease: 'Linear',
            duration: 2000,
            repeat: -1,
            yoyo: false
        });
    }
    
    // tweenで動かす雪玉を削除する関数
    removeTweenSnowballFromAlly(ally) {
        var snowballs = this.tween_snowballGroups.get(ally);
        if (snowballs && snowballs.getChildren().length > 0) {
            var snowball = snowballs.getChildren()[0];
            snowballs.remove(snowball, true, true);
        }
    }

    moveEnemy(enemy) {
        if (enemy.isInvincible) return; //被弾中は移動も射撃もできない
        let closestBullet = null;
        let closestDistance = Number.MAX_VALUE;

        this.allyBullets.children.iterate((bullet) => {
            if (bullet.active) {
                const distance = Phaser.Math.Distance.Between(enemy.x, enemy.y, bullet.x, bullet.y);
                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestBullet = bullet;
                }
            }
        });

        const screenCenterX = this.sys.game.config.width / 2; //横中央の確認
        //const threshold = 100; // 端にどれだけ近ければ切り返すかの閾値
        const threshold = closestDistance; // 端にどれだけ近ければ切り返すかの閾値、弾が近いほど諦めて逃げるべき説

        if (closestBullet && closestDistance < 200) {
            if (enemy.x < threshold) {
                // 画面の左端に近い場合は右へ移動
                enemy.body.setAccelerationX(enemy.speed); // 右に移動
            } else if (enemy.x > this.sys.game.config.width - threshold) {
                //画面の右端に近い場合は左へ移動
                enemy.body.setAccelerationX(-1 * enemy.speed); // 左に移動
            } else if (closestBullet.x < enemy.x) {
                //左から弾が来ていたら右に移動
                enemy.body.setAccelerationX(enemy.speed); // 右に移動
            } else {
                //右から弾が来ていると見なして左に移動
                enemy.body.setAccelerationX(-1 * enemy.speed); // 左に移動
            }
        } else {
            // 近くに弾がなければ、中央に向かって軽く移動するか、停止する
            if (enemy.x < screenCenterX - 50) {
                enemy.body.setAccelerationX(enemy.speed); // ゆっくりと中央に戻る
            } else if (enemy.x > screenCenterX + 50) {
                enemy.body.setAccelerationX(-1 * enemy.speed); // ゆっくりと中央に戻る
            } else {
                enemy.body.setAccelerationX(0); // 加速を止める
            }
        }

        // pace経過したら敵が弾を発射
        if (this.time.now > enemy.lastFired + enemy.pace){
            if (enemy.name == 'forneus' && (this.time.now > enemy.lastSharked + 5000 || (this.time.now > enemy.lastSharked + 700 && enemy.stock_s+enemy.stock_m+enemy.stock_l < 6))){
                this.fireEnemyShark(enemy);
            }else if (enemy.stock_s > 0 || enemy.stock_m > 0 ||enemy.stock_l > 0) {
                this.fireEnemyBullet(enemy);
            }
            enemy.lastFired = this.time.now;
        }
    }
    /**敵「が」射撃するやつ
     * 
     * @param {対象のオブジェクト} enemy 
     * @returns 
     */
    fireEnemyBullet(enemy) {

        // 有効な雪玉のリストを作成
        let totalStock = enemy.stock_s + enemy.stock_m + enemy.stock_l;
        if (totalStock === 0) {
            console.log('No snowballs!');
            return;
        }

        // ランダムな味方に向けて発射
        if (enemy.isInvincible) return;
        // アクティブな味方のリストを作成
        const activeAllies = this.allies.getChildren().filter(ally => ally.active);
        if (activeAllies.length > 0) {
            // ランダムに味方を一人選択
            const targetAlly = Phaser.Math.RND.pick(activeAllies);
            if (targetAlly) {
                // その敵の位置から選択された味方に向けて弾を発射
                const bullet = this.enemyBullets.get(enemy.x, enemy.y + 20);
                if (bullet) {
                    bullet.setActive(true).setVisible(true);
                    /*// 弾の速度と方向を計算して、敵に向けて発射

                    */
                    this.physics.moveTo(bullet, targetAlly.x, targetAlly.y, 200);
                    //弾の大きさを抽選
                    let randomIndex = Phaser.Math.RND.integerInRange(0, totalStock - 1);
                    let randomChoice;
                    if (randomIndex < enemy.stock_s) {
                        randomChoice = 's';
                    } else if (randomIndex < enemy.stock_s + enemy.stock_m) {
                        randomChoice = 'm';
                    } else {
                        randomChoice = 'l';
                    }
                    switch (randomChoice) {
                        case 's':
                            enemy.stock_s--;
                            bullet.damage = 1;
                            bullet.setTexture('enemyBullet_s');
                            bullet.body.setSize(17,17);
                            this.physics.moveTo(bullet, targetAlly.x, targetAlly.y, 400);
                            break;
                        case 'm':
                            enemy.stock_m--;
                            bullet.damage = 2;
                            bullet.setTexture('enemyBullet_m');
                            bullet.body.setSize(33,33);
                            this.physics.moveTo(bullet, targetAlly.x, targetAlly.y, 200);
                            break;
                        case 'l':
                            enemy.stock_l--;
                            bullet.damage = 4;
                            bullet.setTexture('enemyBullet_l');
                            bullet.body.setSize(65,65);
                            this.physics.moveTo(bullet, targetAlly.x, targetAlly.y, 100);
                            break;
                    }
                }
            }
        }
    }

    fireEnemyShark(enemy) {
        // ランダムな味方に向けて発射
        if (enemy.isInvincible) return;
        enemy.lastSharked = this.time.now;
        // アクティブな味方のリストを作成
        const activeAllies = this.allies.getChildren().filter(ally => ally.active);
        if (activeAllies.length > 0) {
            // ランダムに味方を一人選択
            //const targetAlly = Phaser.Math.RND.pick(activeAllies);
            const targetAlly = this.player;
            if (targetAlly) {
                // その敵の位置から選択された味方に向けて弾を発射
                const bullet = this.enemyBullets.get(enemy.x, enemy.y + 20);
                if (bullet) {
                    bullet.setActive(true).setVisible(true);

                    // 初期速度
                    const initialSpeed = 50;
                    bullet.damage = 4;
                    bullet.setTexture('shark').setScale(0.5);
                    bullet.body.setSize(100,200);

                    const angle = Phaser.Math.Angle.Between(bullet.x, bullet.y, targetAlly.x, targetAlly.y);
                    bullet.setVelocity(Math.cos(angle) * initialSpeed, Math.sin(angle) * initialSpeed);
                    // 弾丸をターゲットに向ける
                    this.pointAtTarget(bullet, targetAlly);

                    // 1秒後に弾丸を停止
                    this.time.delayedCall(500, () => {
                        bullet.setVelocity(0, 0);

                        // 停止中に弾丸をターゲットに向け続ける
                        const stopDuration = 1500;
                        const stopUpdateInterval = 50; // 向きを更新する間隔

                        let stopTimeElapsed = 0;
                        const stopUpdateTimer = this.time.addEvent({
                            delay: stopUpdateInterval,
                            callback: () => {
                                if (stopTimeElapsed < stopDuration) {
                                    this.pointAtTarget(bullet, targetAlly);
                                    stopTimeElapsed += stopUpdateInterval;
                                } else {
                                    stopUpdateTimer.remove(false);
                                }
                            },
                            loop: true
                        });

                        // 停止後に弾丸を再度加速させる
                        this.time.delayedCall(stopDuration, () => {
                            const acceleration = 1000;
                            const angle = Phaser.Math.Angle.Between(bullet.x, bullet.y, targetAlly.x, targetAlly.y);
                            bullet.setAcceleration(Math.cos(angle) * acceleration, Math.sin(angle) * acceleration);
                            this.pointAtTarget(bullet, targetAlly);
                        });
                    });
                }
            }
        }
    }

    pointAtTarget(bullet, target) {
        // ターゲットとの角度を計算
        const angle = Phaser.Math.Angle.Between(bullet.x, bullet.y, target.x, target.y);
        // 角度に基づいて弾丸の向きを設定
        bullet.setRotation(angle + 3 * Math.PI / 2);
    }

    bulletHitEnemy(bullet, enemy) {
        // 味方👼の弾が敵👿に当たった時

        this.allyBullets.killAndHide(bullet);
        this.allyBullets.remove(bullet);

        // 雪玉が割れるパーティクル
        this.hit_effect.explode(16,bullet.x,bullet.y);
        bullet.destroy();
        if (enemy.isInvincible) return; //無敵状態なら何もしない

        enemy.health = enemy.health - bullet.damage; //雪玉種類ごとにダメージを変える

        //スコアを雪玉の大きさに応じて加算する
        this.score_emit("angel",bullet.damage * 987,0,2,bullet.x,bullet.y);

        if (enemy.health <= 0) {

            enemy.isInvincible = true; // 無敵状態に設定
            // 点滅処理
            this.tweens.add({
                targets: enemy,
                alpha: { from: 0.5, to: 1 }, // 半透明と完全表示の間で点滅
                duration: 50, // 点滅インターバル
                yoyo: true, // 元に戻るアニメーションを有効
                repeat: 20, // 繰り返し回数
                onComplete: () => {
                    enemy.isInvincible = false; // 無敵状態解除
                    enemy.health = enemy.health_MAX; //復活
                    enemy.alpha = 1; // 完全表示に戻す
                }
            });
            enemy.body.velocity.x = 0;
            enemy.body.acceleration.x = 0;
            this.score += 1;
        }

    }

    enemyBulletHitAlly(ally, bullet) {
        // 敵👿の弾が味方👼に当たった時

        this.enemyBullets.killAndHide(bullet);
        this.enemyBullets.remove(bullet);
        // 味方へのダメージ処理など

        // 雪玉が割れるパーティクル
        this.hit_effect.explode(16,bullet.x,bullet.y);
        this.hit_se1.play();
        bullet.destroy();
        if (ally.isInvincible) return; //無敵状態なら何もしない
        ally.health = ally.health - bullet.damage;//一旦通常雪玉想定の2ダメージで

        //スコアを雪玉の大きさに応じて？加算する
        this.score_emit("daemon",0,bullet.damage * 997,2,bullet.x,bullet.y);

        if (ally.health <= 0) {

            ally.isInvincible = true; // 無敵状態に設定
            // 点滅処理
            this.tweens.add({
                targets: ally,
                alpha: { from: 0.5, to: 1 }, // 半透明と完全表示の間で点滅
                duration: 50, // 点滅インターバル
                yoyo: true, // 元に戻るアニメーションを有効
                repeat: 20, // 繰り返し回数
                onComplete: () => {
                    ally.isInvincible = false; // 無敵状態解除
                    ally.health = ally.health_MAX;// 復活
                    ally.alpha = 1; // 完全表示に戻す
                }
            });
            ally.body.velocity.x = 0; //被弾時に速度を0に
            ally.body.acceleration.x = 0;

            this.ally_damage += 1;
        }
        this.cameras.main.shake(300, 0.005);//ちょっと揺らすダメージ表現
    }

    bulletHitAlly(bullet, ally) {
        // サンダルフォンの後頭部に雪玉が当たった時

        this.allyBullets.killAndHide(bullet);
        this.allyBullets.remove(bullet);

        // 雪玉が割れるパーティクル
        bullet.destroy();
        this.hit_effect.explode(16,bullet.x,bullet.y);
        this.hit_se1.play();

        // 味方へのダメージ処理など
        if (ally.isInvincible) return; //無敵状態なら何もしない
        ally.isInvincible = true; // 無敵状態に設定
        // 点滅処理
        this.tweens.add({
            targets: ally,
            alpha: { from: 0.5, to: 1 }, // 半透明と完全表示の間で点滅
            duration: 50, // 点滅インターバル
            yoyo: true, // 元に戻るアニメーションを有効
            repeat: 20, // 繰り返し回数
            onComplete: () => {
                ally.isInvincible = false; // 無敵状態解除
                ally.alpha = 1; // 完全表示に戻す
            }
        });
        ally.body.velocity.x = 0; //被弾時に速度を0に
        ally.body.acceleration.x = 0;

        this.friendly_fire += 1;
        this.cameras.main.shake(300, 0.005);//ちょっと揺らすダメージ表現

    }

    enemyBulletHitPlayer(player, bullet) {
        // 敵の弾がプレイヤーに当たった時

        this.enemyBullets.killAndHide(bullet);
        this.enemyBullets.remove(bullet);

        // 雪玉が割れるパーティクル
        this.hit_effect.explode(16,bullet.x,bullet.y);
        this.hit_se2.play();
        // プレイヤーへのダメージ処理など
        bullet.destroy();
        if (player.isInvincible) return; //無敵状態なら何もしない

        //スコアを雪玉の大きさに応じて加算する プレイヤーの被弾影響を大きく5倍にする
        this.score_emit("daemon",0,bullet.damage * 4957 ,5,bullet.x,bullet.y);

        player.isInvincible = true; // 無敵状態に設定
        // 点滅処理
        this.tweens.add({
            targets: player,
            alpha: { from: 0.5, to: 1 }, // 半透明と完全表示の間で点滅
            duration: 50, // 点滅インターバル
            yoyo: true, // 元に戻るアニメーションを有効
            repeat: 20, // 繰り返し回数
            onComplete: () => {
                player.isInvincible = false; // 無敵状態解除
                player.alpha = 1; // 完全表示に戻す
            }
        });
        player.body.velocity.x = 0; //被弾時に速度を0に
        player.body.acceleration.x = 0;

        this.player_damage += 1;
        this.cameras.main.shake(300, 0.005); //ちょっと揺らすダメージ表現


        bullet.destroy();
        
    }

    bulletCancel(playerBullet, enemyBullet) {
        if (playerBullet.damage > 3){
        // 弾同士の相殺を試しに作ってみる
        this.enemyBullets.killAndHide(enemyBullet);
        this.enemyBullets.remove(enemyBullet);
        }
        if (enemyBullet.damage > 3){
        this.allyBullets.killAndHide(playerBullet);
        this.allyBullets.remove(playerBullet);
        }
    }

    handleBulletsOutOfBounds(bulletsGroup) {
        // 画面外に出た弾を非表示にする(グループ内の各オブジェクトが画面外に出たら消滅させる)
        //消滅によってグループ内が変動するときはiterateではなくeachを使う
        bulletsGroup.children.each((bullet) => {
            if (bullet.active && (bullet.y < 0 || bullet.y > 800 || bullet.x < 0 || bullet.x > 600)) {
                bulletsGroup.killAndHide(bullet);
                bulletsGroup.remove(bullet);
                bullet.setVelocity(0, 0);
                bullet.destroy();
            }
        }, this);
    }

    avoidEnemyBullets(ally) {
        if (ally.isInvincible) return;
        let closestBullet = null;
        let closestDistance = Number.MAX_VALUE;

        this.enemyBullets.children.iterate((bullet) => {
            if (bullet.active) {
                const distance = Phaser.Math.Distance.Between(ally.x, ally.y, bullet.x, bullet.y);
                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestBullet = bullet;
                }
            }
        });

        const screenCenterX = this.sys.game.config.width / 2; //横中央の確認
        //const threshold = 100; // 端にどれだけ近ければ切り返すかの閾値
        const threshold = closestDistance; // 端にどれだけ近ければ切り返すかの閾値、弾が近いほど諦めて逃げるべき説

        if (closestBullet && closestDistance < 200) {
            if (ally.x < threshold) {
                // 画面の左端に近い場合は右へ移動
                ally.body.setAccelerationX(ally.speed); // 右に移動
            } else if (ally.x > this.sys.game.config.width - threshold) {
                //画面の右端に近い場合は左へ移動
                ally.body.setAccelerationX(-1 * ally.speed); // 左に移動
            } else if (closestBullet.x < ally.x) {
                //左から弾が来ていたら右に移動
                ally.body.setAccelerationX(ally.speed); // 右に移動
            } else {
                //右から弾が来ていると見なして左に移動
                ally.body.setAccelerationX(-1 * ally.speed); // 左に移動
            }
        } else {
            // 近くに弾がなければ、中央に向かって軽く移動するか、停止する
            if (ally.x < screenCenterX - 50) {
                ally.body.setAccelerationX(ally.speed); // ゆっくりと中央に戻る
            } else if (ally.x > screenCenterX + 50) {
                ally.body.setAccelerationX(-1 * ally.speed); // ゆっくりと中央に戻る
            } else {
                ally.body.setAccelerationX(0); // 加速を止める
            }
        }
    }

    startHold() {
        this.isHold = true;
        //this.chargeEffect.setVisible(true).play('charging');
    }
    stopHold() {
        this.isHold = false;
        //this.chargeEffect.setVisible(false);
    }
    score_emit(side,plus_score_angel,plus_score_daemon,amount,x,y) {
        const scores = {
            plus_score_angel: plus_score_angel,
            plus_score_daemon: plus_score_daemon,
            side: side,
            amount: amount,
            x:x,
            y:y
        };
        this.game.events.emit('update-score', scores);
    }
    Timeup() {
        this.game.events.off('Timeup', this.Timeup, this);
        this.game.events.off('GameOver', this.GameOver, this);

        this.game.events.emit('change2create');
        this.scene.start('RhythmScene');
    }
    GameOver() {
        // ゲームの動きを止める
        this.physics.pause();
        this.sys.pause();
    }

}

class RhythmScene extends Phaser.Scene {
    constructor() {
        super({ key: 'RhythmScene' })
    }
    preload() {
        // ここでゲームのアセット（画像、音など）を読み込む
        this.load.image('table', 'assets/table.png'); // テーブルの画像
        this.load.image('bubble', 'assets/balloon.png'); // 吹き出しの画像

        this.load.image('michael_idle1', 'assets/michael_idle1.png');
        this.load.image('michael_idle2', 'assets/michael_idle2.png');
        this.load.image('michael_idle3', 'assets/michael_idle3.png');
        this.load.image('michael_wink', 'assets/michael_wink.png');
        this.load.image('michael_makingSnowball1', 'assets/michael_makingSnowball1.png');
        this.load.image('michael_makingSnowball2', 'assets/michael_makingSnowball2.png');
        this.load.image('michael_makingSnowball3', 'assets/michael_makingSnowball3.png');

        this.load.image('sandalphon_cutin','assets/sandalphon_cutin.png');
        this.load.image('gabriel_cutin','assets/gabriel_cutin.png');
        this.load.image('uriel_cutin','assets/uriel_cutin.png');
        this.load.image('gradation','assets/gradation.png');
    }
    create() {
        // ゲームの初期設定を行う

        // ゲームの画面サイズを設定（中央に配置するためのオフセットを使用）
        this.cameras.main.setViewport(0, 0, 600, 800);
        this.cameras.main.setZoom(1);


        this.makingSnowball = false; // 雪玉作成中のフラグを下ろす
        // 雪玉のサイズのリストの初期設定
        this.size_list = [
            ['small', 30],
            ['medium', 70],
            ['large', 100]
        ];
        this.tableSnowballsLayout = [0, 0, 0]; //テーブル上の雪玉の位置をリストで管理

        //デバッグ用にtextを表示しておく 最終的にスコア表示にする
        this.text = this.add.text(10, 10, '', { font: '16px Courier', fill: '#00ff00' }).setVisible(false);

        this.tableSnowballs = []; //テーブル上の雪玉の大きさを保持する配列
        this.maxSnowballs = 1; // テーブルに置ける雪玉の最大数
        this.requests = []; // 味方の要求を格納する配列
        this.handnumb = 0; // 手のかじかみ度(雪玉作成速度の難易度)

        this.ballAmountList = [0, 0, 0]; //スコア用のリスト
        this.timeout_request = 0; //時間経過してしまったリクエスト数

        // 雪玉のサイズを大きくするポインターイベント
        this.input.on('pointerdown', this.startMakingSnowball, this);
        this.input.on('pointerup', this.finishMakingSnowball, this);
        //this.input.on('pointerout', this.finishMakingSnowball, this);

        /*
        ■くもりの一口メモ
        ～input.activePointerとinput.on('イベント')の違い編～
        input.activePointerはオブジェクト? xやyやdurationのパラメータを持つ
        input.onはイベント ポインターが押されたり離されたり、対象のオブジェクトの外に出たりしたことを受け取る
        
        ゲーム画面領域外にポインターが出たときの挙動
        ★PCの場合
        ・pointeroutはゲーム画面から出たことを感知できない
        ・ゲーム画面から出たらpointerupもdownも感知不能になる
        ・input.activePointerはポインタが押された時にx,yが代入、更新はされないがdurationは更新される
        ・ゲーム画面内で押下した後に画面外にそのままスワイプしてホールドした場合、画面外に出た瞬間xyの更新は止まる
        ★スマートフォン(開発者ツールでのエミュレート)の場合
        ・pointeroutはゲーム画面から出たことを感知できない
        ・ゲーム画面から出たらdownは感知不能になるが、なぜかpointerupは感知できる
        ・input.activePointerはポインタが押された時にx,yが代入、更新はされないがdurationは更新される
        ・ゲーム画面内で押下した後に画面外にそのままスワイプしてホールドした場合、離すまではxyも更新され続ける
        
        モバイル対応ヤバすぎて泣いている

        ユーザーエージェントで判断するのではなく、タッチ入力のリスナーを仕込んでモバイルかどうか判断するのが丸そう
        var IS_TOUCH = false;
        window.addEventListener('タッチスタート', function()
        {           
            IS_TOUCH = true;
        });
        */

        //静止状態のミカエルの画像の設置と雪玉制作中のアニメーションの定義
        this.michael_Rhythm = this.add.sprite(150, 650, 'michael_idle1').setScale(0.5);
        this.anims.create({
            key: 'michael_makingSnowball',
            frames: [
                { key: 'michael_makingSnowball1' },
                { key: 'michael_makingSnowball2' },
                { key: 'michael_makingSnowball3' }
            ],
            frameRate: 3,
            repeat: -1
        });

        // seを設定
        this.nice_se = this.sound.add('nice_se', { volume: 0.5 });  // 音量を0.5に設定
        this.bad_se = this.sound.add('bad_se',{ volume: 0.4});

        // 味方の要求を生成
        //this.spawnAllyRequests();

        // 作成中の雪玉の表示
        this.snowball = this.add.circle(500, 700, 30, 0xffffff);

        // 受け取り待ちの雪玉の表示
        this.table = this.add.sprite(430, 540, 'table').setScale(0.5);

        this.allies_list = ['sandalphon', 'uriel', 'gabriel'];
        this.cutIns = {};

        // 0.7秒ごとに雪玉を要求
        this.time.addEvent({
            delay: 300,
            callback: this.generateRequest,
            callbackScope: this,
            loop: true
        });

        //フレームUIとやり取りするイベントリスナー
        this.game.events.on('Timeup', this.Timeup, this);
        this.game.events.on('GameOver', this.GameOver, this);
    }
    update() {
        const p = this.input.activePointer;
        const frequency = 400; // 振動の頻度を調整 上げるとゆっくりになる
        const amplitude = 100; // 振幅（雪玉の最大サイズ）
        /*
        ■くもりの一口メモ
        ～varとletとconstのスコープの違い編～

        varは関数スコープ、letとconstはブロック("{}"のこと)スコープ。
        つまり、if文の中でletやconstで宣言した変数はif文の外からは参照できないぞ。
        先月も嵌まっているので注意！

        ちなみに、constは定数を宣言するときに使うもの。
        letと違って再宣言も再代入も出来ない(もちろんブロックから出たら無かったことにはなる)ので、
        主にブロックの先頭で宣言する際に使用して、文中でチマチマ宣言するべきではないぞ。

        */

        if (this.makingSnowball == true) {
            var duration = this.time.now - this.snowballMakingStart; // 雪玉作成にかかった時間
            this.handnumb++; //雪玉作成中は毎フレーム手のかじかみが上がっていく
        } else {
            var duration = 0; //雪玉を作成中でないならかかった時間をリセットしておく
        }

        // 正弦波を使用して雪玉サイズの振動を計算
        this.snowball.radius = Math.abs(100 - amplitude * Math.abs(Math.cos(duration / (frequency + this.handnumb)))) * 0.8 + 20;

        // ★色が直感的ではないかも
        if (this.snowball.radius < 30) {
            //this.snowball.setFillStyle(0xff9999);
            this.snowball.setFillStyle(0x6666ff);
        } else if (this.snowball.radius < 70) {
            //this.snowball.setFillStyle(0x99ff99);
            this.snowball.setFillStyle(0x99ff99);
        } else {
            //this.snowball.setFillStyle(0x9999ff);
            this.snowball.setFillStyle(0xff9999);
        }

        // テーブル上に雪玉を描画する処理
        //for (const on_snowball in this.tableSnowballs) {} で処理すると配列番号が取れずに困りそう？
        for (let table_number = 0; table_number < this.maxSnowballs; table_number++) {
            if (this.tableSnowballs[table_number]) {
                // 配列上に雪玉があるなら描画する
                //this.created_snowball_${table_number}.setVisible(true);
                //this.created_snowball_${table_number}.radius = this.tableSnowballs[table_number];
            } else {
                //this.created_snowball_${table_number}.setVisible(false);
            }
        }

        //雪玉と要求の照合処理
        this.matchSnowballAndRequest();

        this.text.setText([
            `マウスx: ${p.x}`,
            `マウスy: ${p.y}`,
            `長押し時間duration: ${Math.round(p.getDuration())}`,
            `雪玉サイズ: ${this.snowball.radius}`,
            `ボール量: ${this.ballAmountList}`,
            `ペナルティ: ${this.timeout_request}`
        ]);
    }
    startMakingSnowball() {
        // 雪玉作成開始時のロジック
        this.snowball.radius = 0; // 雪玉のサイズをリセット
        this.makingSnowball = true; // 雪玉作成中のフラグを立てる
        this.updateCharacter();
        this.snowballMakingStart = this.time.now; // 雪玉作成を開始した時間を記録
    }
    finishMakingSnowball() {
        // 雪玉作成終了時のロジック

        if (this.matchmakingSnowballAndRequest(this.snowball.radius)){//直接納品
        }else if(this.tableSnowballs.length < this.maxSnowballs && !this.isTableAnimation){ //雪玉がテーブルに置ける状態か
            const size = this.snowball.radius;
            var x = Phaser.Math.Between(100, 500);
            if (this.tableSnowballsLayout[1] == 0) {
                var x = 430;
                this.tableSnowballsLayout[1] = 1;
            } else if (this.tableSnowballsLayout[0] == 0) {
                var x = 280;
                this.tableSnowballsLayout[0] = 1;
            } else if (this.tableSnowballsLayout[2] == 0) {
                var x = 580;
                this.tableSnowballsLayout[2] = 1;
            }
            const y = 550;

            this.isTableAnimation = true;
            const on_snowball = this.add.circle(500, 700, size, 0xffffff).setOrigin(0.5, 1);
            on_snowball.size = size; //サイズプロパティを追加(数値)

            this.tweens.add({
                targets: [on_snowball],
                ease: 'Power3',
                duration: 100,
                x: x,
                y: y,
                onComplete: () => {
                    this.isTableAnimation = false;  // アニメーション完了時にフラグを更新

                    //雪玉スプライトを作成し、テーブルの配列に追加
                    //const on_snowball = this.add.circle(x, y, size, 0xffffff).setOrigin(0.5, 1)
                    //on_snowball.size = size; //サイズプロパティを追加(数値)
                    this.tableSnowballs.push(on_snowball);
                }
            });
        }else{
            this.cameras.main.shake(300, 0.005); //ちょっと揺らすダメージ表現
            this.bad_se.play();
            //this.score_emit("daemon",0,356,1,510,700);
        }

        this.makingSnowball = false; // 雪玉作成中のフラグを下ろす
        this.updateCharacter();
    }
    removeRandomSnowball() { //未使用
        if (this.tableSnowballs.length > 0) {
            const randomIndex = Phaser.Math.Between(0, this.tableSnowballs.length - 1);
            const snowballToRemove = this.tableSnowballs.splice(randomIndex, 1)[0];
            snowballToRemove.destroy(); // 雪玉スプライトを破棄
        }
    }
    updateCharacter() {
        if (this.makingSnowball) {
            // 雪玉を作っているアニメーション
            this.michael_Rhythm.play('michael_makingSnowball', true);
        } else {
            // 静止している状態
            this.michael_Rhythm.play('michael_idle', true);
        }
    }
    generateRequest() {
        const isRequest = true;//Phaser.Math.Between(0, 4) > -1; // 100%の確率でリクエストになる
        const allies_list = ['sandalphon', 'uriel', 'gabriel'];
        const bubble_ally = Phaser.Math.RND.pick(allies_list);
    
        // 既に同キャラクターのリクエストがある場合は新たに生成しない
        if (this.requests.some(request => request.ally === bubble_ally)) {
            //console.log('同名リクエストがある');
            return;
        }

        if (isRequest) {
            const size = Phaser.Math.RND.pick(this.size_list); // ランダムな雪玉サイズの要求を作成
            //const size = ['small', 30];

            const bubble_text_content = this.generateBubbleText(bubble_ally, size[0]);
            const skill_text_content = this.generateSkillText(size[0]);
    
            // リクエストを追加
            const request = { ally: bubble_ally, size_name: size[0], isFulfilled: false };
            /*request.timeout = this.time.delayedCall(100000, () => {
                if (!request.isFulfilled) {
                    // ペナルティの適用
                    this.timeout_request++; //ペナルティスコアを記録
                    this.score_emit("daemon",0,551,1,430,300);
                    // リクエスト関連のオブジェクトを破棄
                    this.completeOrder(bubble_ally);
                    // このリクエストをrequests配列から削除
                    //this.requests = this.requests.filter(r => r !== request);
                }
            }, [], this);
            */

            this.requests.push(request);
    
            // アニメーションカットインを作成
            this.createAndPlayCutIn(bubble_ally, size[0], bubble_text_content, skill_text_content);
        } else {
            // 要求ではない吹き出し(お邪魔とフレーバー要素)
            const bubble_text_content = this.generateBubbleText(bubble_ally, 'NULL');
            const skill_text_content = '';
    
            // アニメーションカットインを作成
            this.createAndPlayCutIn(bubble_ally, 'NULL', bubble_text_content, skill_text_content);
        }
    }
    
    generateBubbleText(bubble_ally, size) {
        let text_content_list = [];
        if (bubble_ally == 'sandalphon') {
            if (size == 'small') {
                text_content_list = ['小粒なやつ！', '小さくていいわ！', '小さいのお願い！', 'どんどん持ってきなさーい！'];
            } else if (size == 'medium') {
                text_content_list = ['投げやすいサイズで！', 'メインの玉をお願い！', '普通の作って！'];
            } else if (size == 'large') {
                text_content_list = ['大きくて強いの頂戴！', '大玉で頼むわ！', 'とにかく巨大なやつ！', '容赦しないわ！'];
            } else {
                text_content_list = ['おりゃ！', '痛い！','いま後頭部にぶつかった！？'];
            }
        } else if (bubble_ally == 'uriel') {
            if (size == 'small') {
                text_content_list = ['連射用をくれ！', '牽制に小さいやつ！', '小さめで頼む！','まだまだ足りねぇ！'];
            } else if (size == 'medium') {
                text_content_list = ['ちょうどいいやつ頼む！', '中くらいのよろしく！！', 'じゃんじゃん持ってこぉい！'];
            } else if (size == 'large') {
                text_content_list = ['でっけーやつ作ってくれ！', 'トドメ用のデカいのを！','強いやつ頼む！','最大火力でいくぜぇぇ！！'];
            } else {
                text_content_list = ['食らえ！', 'いくぜ！', 'おらぁぁぁぁ！', '負けられねぇぇぇぇ！！'];
            }
        } else if (bubble_ally == 'gabriel') {
            if (size == 'small') {
                text_content_list = ['小さめをください！', '手頃なサイズを頼みます！'];
            } else if (size == 'medium') {
                text_content_list = ['標準的なサイズを', '中程度のもので！', '勝利に導きましょう！'];
            } else if (size == 'large') {
                text_content_list = ['大きい玉をお願いします！', '巨大なものを！！','最大出力まいります！'];
            } else {
                text_content_list = ['危ない！', 'いきますよ！', '防ぎきれませんよ！', '加勢いたします！'];
            }
        }
        return Phaser.Math.RND.pick(text_content_list); // ランダムなセリフのピックアップ
    }
    
    generateSkillText(size) {
        if (size == 'small') {
            return '小さい雪玉';
        } else if (size == 'medium') {
            return '中くらいの雪玉';
        } else if (size == 'large') {
            return '大きい雪玉';
        } else {
            return '';
        }
    }
    
    createAndPlayCutIn(name, size, bubble_text_content, skill_text_content) {
        const offsetYMap = {
            'sandalphon': 200,
            'uriel': 400,
            'gabriel': 300
        };
        const offsetY = offsetYMap[name];
        if(!this.requests.some(request => request.ally === name)) {//requestsにrequestが無いなら弾く
            console.log('リクエスト無し');
            return;
        }
        if (this.cutIns[name] && this.cutIns[name].isAnimating) {
            console.log('進行中');
            return;  // このキャラクターのアニメーションがすでに進行中の場合は何もしない
        }
        
        this.destroyCutIn(name);  // 古いカットインを破棄
    
        // カットインの各要素を作成する
        const whiteRectangle = this.add.rectangle(-600, offsetY, 600, 71, 0xffffff, 0.5).setOrigin(0, 0.5);
        const character = this.add.image(-300, offsetY, `${name}_cutin`).setScale(0.5);
        const gradientRectangle = this.add.image(-300, offsetY + 25, 'gradation').setScale(0.5).setOrigin(0.5, 0.5);
        const skillTextColors = {
            small: '#CCCCFF', // 青
            medium: '#AAFFAA', // 緑
            large: '#FFAAAA' // 赤
        };        
        const skillText = this.add.text(-100, offsetY + 25, skill_text_content, { fontSize: '16px', fontFamily: 'Corporate-Logo-Rounded-Bold', color: skillTextColors[size] }).setOrigin(0.5).setPadding(0, 4, 0, 0);
        const speechBubble = this.add.image(430, offsetY - 30, 'bubble').setScale(0);
        const bubbleText = this.add.text(430, offsetY - 30, bubble_text_content, { fontSize: '16px', fontFamily: 'Corporate-Logo-Rounded-Bold', color: '#000000' }).setOrigin(0.5).setPadding(0, 4, 0, 0).setScale(0);
    
        this.cutIns[name] = { whiteRectangle, character, gradientRectangle, skillText, speechBubble, bubbleText, isAnimating: true };
        this.playCutIn(name);
    }
    
    playCutIn(name) {
        const cutIn = this.cutIns[name];
        this.tweens.add({
            targets: [cutIn.whiteRectangle],
            x: 0,
            ease: 'Power2',
            duration: 500,
            onComplete: () => {
                this.launchStage2(cutIn);
            }
        });
    }
    
    launchStage2(cutIn) {
        this.tweens.add({
            targets: [cutIn.character],
            x: 300,
            ease: 'Power2',
            duration: 300,
            onComplete: () => {
                cutIn.isAnimating = false;  // アニメーション完了時にフラグを更新?
            }
        });
        this.tweens.add({
            targets: [cutIn.gradientRectangle],
            x: 300,
            ease: 'Power2',
            duration: 500
        });
        this.tweens.add({
            targets: [cutIn.skillText],
            x: 550,
            ease: 'Power2',
            duration: 500
        });
        this.tweens.add({
            targets: [cutIn.speechBubble],
            scale: 0.5,
            ease: 'Power3',
            duration: 700,
            onComplete: () => {
                cutIn.isAnimating = false;  // アニメーション完了時にフラグを更新
            }
        });
        this.tweens.add({
            targets: [cutIn.bubbleText],
            scale: 1,
            ease: 'Power3',
            duration: 700,
        });
    }
    
    completeOrder(name) {
        const cutIn = this.cutIns[name];
        if (!cutIn) {
            return;  // アニメーションが進行中または存在しないカットインは無視
        }
        cutIn.isAnimating = true;
        this.tweens.add({
            targets: [cutIn.whiteRectangle, cutIn.character, cutIn.gradientRectangle, cutIn.skillText, cutIn.speechBubble, cutIn.bubbleText],
            x: '+=600',
            ease: 'Power2',
            duration: 500,
            onComplete: () => {

                // リクエストの削除
                this.requests = this.requests.filter(r => r.ally !== name);
                cutIn.isAnimating = false; // アニメーション完了後にフラグをリセット
                this.destroyCutIn(name);
            }
        });
    }
    
    destroyCutIn(name) {
        const cutIn = this.cutIns[name];
        if (cutIn) {
            Object.values(cutIn).forEach(obj => {
                if (obj.destroy) obj.destroy();  // 存在していれば破棄
            });
            delete this.cutIns[name];  // オブジェクトから削除
        }
    }
    
    
    matchSnowballAndRequest() {
        /*
        ■くもりの一口メモ
        ～for文中に配列要素を削除する場合編～
        
        for each中に配列の削除が発生する場合、削除した次のインデックスの配列要素はインデックス番号が前にずれ込む。
        その結果、次の周でforの参照インデックスがひとつ後ろに進むと、その配列要素は参照をスキップされてしまう。

        これを防ぐため、削除が発生する場合の配列の参照を後ろからにすることがある。
        (eachではなく、仮変数にインデックス番号を与えて減算していく)

        今回の雪玉チェックはすり抜けが発生しても何度もチェックするから、問題ないものとして無視しようとしたが、
        そもそもfor eachではbreakが使えず、一度マッチして消滅が確定した吹き出しで雪玉に再マッチし複数の雪玉を消してしまうので
        forで後ろから参照に書き換えた。

        */
        for (let requestIndex = this.requests.length - 1; requestIndex >= 0; requestIndex--) {
            let request = this.requests[requestIndex];
            for (let on_snowballIndex = this.tableSnowballs.length - 1; on_snowballIndex >= 0; on_snowballIndex--) {
                let on_snowball = this.tableSnowballs[on_snowballIndex];
                if (request.size_name == this.snowballSizeName(on_snowball.size)) {
                    const cutIn = this.cutIns[request.ally];
                    if (!cutIn || cutIn.isAnimating || request.isFulfilled) {
                        continue; // カットインが存在しない、またはアニメーション中の場合、またはクリア済みの場合はスキップ
                    }
                    request.isFulfilled = true; // クリア済みの要求フラグ
                    this.nice_se.play();
                    //this.score_emit("angel",570,0,1,440,550);
                    // 雪玉が吹き出しに向かって移動するアニメーション
                    this.tweens.add({
                        targets: on_snowball,
                        x: cutIn.speechBubble.x,
                        y: cutIn.speechBubble.y,
                        scale: 0, // 吸い込まれるように小さくなる
                        duration: 700, // アニメーションの時間
                        ease: 'Cubic.easeIn',
                        onComplete: () => {
                            // サイズに応じたスコアを加算しておく
                            if (request.size_name == this.size_list[0][0]) {
                                this.ballAmountList[0]++;
                            } else if (request.size_name == this.size_list[1][0]) {
                                this.ballAmountList[1]++;
                            } else if (request.size_name == this.size_list[2][0]) {
                                this.ballAmountList[2]++;
                            }
    
                            on_snowball.destroy(); // 雪玉スプライトを破棄
                            // カットインを完了して削除
                            this.completeOrder(request.ally);
    
                        }
                    });
    
                    // テーブル上の配置フラグを降ろす
                    if (on_snowball.x == 430) {
                        this.tableSnowballsLayout[1] = 0;
                    } else if (on_snowball.x == 280) {
                        this.tableSnowballsLayout[0] = 0;
                    } else if (on_snowball.x == 580) {
                        this.tableSnowballsLayout[2] = 0;
                    }
    
                    this.tableSnowballs.splice(on_snowballIndex, 1);
    
                    return true; // マッチしたらその他の雪玉をチェックする必要はないのでループを抜ける
                }
            }
        }
        return false;
    }
    matchmakingSnowballAndRequest(size) {
        for (let requestIndex = this.requests.length - 1; requestIndex >= 0; requestIndex--) {
            let request = this.requests[requestIndex];
            if (request.size_name == this.snowballSizeName(size)) {
                const cutIn = this.cutIns[request.ally];
                if (!cutIn || cutIn.isAnimating|| request.isFulfilled) {
                    continue; // カットインが存在しない、またはアニメーション中の場合、またはクリア済みの場合はスキップ
                }
                request.isFulfilled = true; // クリア済みの要求フラグ
                this.nice_se.play();
                //this.score_emit("angel",551,0,1,510,700);
                // 雪玉が吹き出しに向かって移動するアニメーション
                let snowball = this.add.circle(500, 700, size, 0xffffff);
                this.tweens.add({
                    targets: snowball,
                    x: cutIn.speechBubble.x,
                    y: cutIn.speechBubble.y,
                    scale: 0, // 吸い込まれるように小さくなる
                    duration: 700, // アニメーションの時間
                    ease: 'Cubic.easeIn',
                    onComplete: () => {
                        // サイズに応じたスコアを加算しておく
                        if (request.size_name == this.size_list[0][0]) {
                            this.ballAmountList[0]++;
                        } else if (request.size_name == this.size_list[1][0]) {
                            this.ballAmountList[1]++;
                        } else if (request.size_name == this.size_list[2][0]) {
                            this.ballAmountList[2]++;
                        }
                        


                        snowball.destroy(); // 雪玉スプライトを破棄
                        
                        // カットインを完了して削除
                        this.completeOrder(request.ally);
    
                    }
                });
    
                return true; // マッチしたらその他の雪玉をチェックする必要はないのでループを抜ける
            }
        }
        return false;
    }
    
    //this.size_list = [['small', 30],['medium', 70],['large', 100]];
    snowballSizeName(size) {
        /*
        ■くもりの一口メモ
        ～for inとfor ofの違い編～

        for...inは指定された連想配列（オブジェクト）から要素を取り出して先頭から順に処理する。
        出力されるのはキーであり、値は出力されない。
        値を出力したければ、出力されるキーを連想配列に対して与え直して、値を引き出すことは可能。
        ただ、連想配列(キーと値があるやつ)ではない、配列(インデックス番号と値があるやつ)に使うことは望ましくないとされている。
        余計なものを引っ張ってきてしまうことがある、処理の順序が保証されているわけではないため。

        for...ofは、同様に配列から要素を取り出して先頭から順に処理するが、
        出力されるのは値である。
        
        */
        for (var checksize of this.size_list) {
            if (size < checksize[1]) {
                return checksize[0];
            }
        }
    }
    score_emit(side,plus_score_angel,plus_score_daemon,amount,x,y) {
        const scores = {
            plus_score_angel: plus_score_angel,
            plus_score_daemon: plus_score_daemon,
            side: side,
            amount: amount,
            x:x,
            y:y
        };
        this.game.events.emit('update-score', scores);
    }
    GameOver() {
        // ゲームの動きを止める
        //this.physics.pause();
        //this.sys.pause();
    }
    Timeup() {
        //フレームUIとやり取りするイベントリスナーを削除
        this.game.events.off('Timeup', this.Timeup, this);
        this.game.events.off('GameOver', this.GameOver, this);

        this.game.events.emit('change2shooting');
        this.scene.start('ShootingScene', { ballAmount_s: this.ballAmountList[0], ballAmount_m: this.ballAmountList[1], ballAmount_l: this.ballAmountList[2]});
    }
    
}

// FrameScene: フレームとUIを管理
class FrameScene extends Phaser.Scene {
    constructor() {
        super('FrameScene');
    }

    preload() {
        this.load.image('star', 'assets/charge_4.png'); 
    }

    create() {
        // フレームの背景色を設定
        this.cameras.main.setBackgroundColor('#000000');
        
        //タイムバー矩形を設置
        this.timeBar = this.add.graphics();
        // スコアゲージの裏地
        this.scoreGauge_background = this.add.graphics({ x: 0, y: 0 });
        // ドーナツの中心座標と半径
        const centerX = 514;
        const centerY = 87;
        const outerRadius = 77;
        const innerRadius = 56;

        // ゲージ下部の欠け50度分を考慮し、全周を310度としたときの角度に換算
        var startAngle_angel = Phaser.Math.DegToRad(115);
        var startAngle_daemon = Phaser.Math.DegToRad(65);
        
        // グラフィックスをクリアして新たに描画
        this.scoreGauge_background.clear();
        this.scoreGauge_background.fillStyle(0x000000, 1); // 黒色で不透明
        this.scoreGauge_background.beginPath();
        this.scoreGauge_background.arc(centerX, centerY, outerRadius, startAngle_daemon, startAngle_angel, true);
        this.scoreGauge_background.lineTo(centerX + innerRadius * Math.cos(startAngle_angel), centerY + innerRadius * Math.sin(startAngle_angel));
        this.scoreGauge_background.arc(centerX, centerY, innerRadius, startAngle_angel, startAngle_daemon, false);
        this.scoreGauge_background.lineTo(centerX + outerRadius * Math.cos(startAngle_daemon), centerY + outerRadius * Math.sin(startAngle_daemon));
        this.scoreGauge_background.closePath();
        this.scoreGauge_background.fillPath();

        // スコアの初期値
        this.score_angel = 0;
        this.score_daemon = 0;
        this.maxScore = 100000;  // スコアの初期最大値
        this.endFlag = 0;
        this.scoreGauge_angel = this.add.graphics({ x: 0, y: 0 });
        this.scoreGauge_daemon = this.add.graphics({ x: 0, y: 0 });

        this.timeBar.fillStyle(0x4ac8a1, 0.5); // 色と透明度
        this.timeWidth_full = 436; //ゲージの横の長さ
        this.timeBar.fillRect(94, 66, 436, 35); // 位置とサイズ

        this.elapsed = 0; //Scene内の累計経過時間（ミリ秒）
        this.totalDuration = 30000; // 持ち時間

        // タイマーイベントの設定
        this.timeEvent = this.time.addEvent({
            delay: 100, // 0.1秒ごとに更新
            callback: this.updateTimeBar,
            callbackScope: this,
            loop: true
        });

        // フレームをゲージの後に読み込み
        this.frame_making = this.add.image(300, 400, 'frame_making');
        this.frame_making.setDisplaySize(600, 800);
        this.frame_shooting = this.add.image(300, 400, 'frame_shooting');
        this.frame_shooting.setDisplaySize(600, 800).setVisible(false);
        // GameSceneを起動
        this.scene.launch('RhythmScene', { x: 48, y: 128 });
        // 48,128,552,800 => 504*672 = 600*800 * 0.84
        
        // OverwriteSceneを起動
        this.scene.launch('OverwriteScene');
        this.score_angel_effect = this.add.particles(0, 0, 'star', {
            moveToX: 514,
            moveToY: 87,
            lifespan: 500,
            scale: { start: 1, end: 0.3 },
            alpha: { start: 1, end: 0 },
            frequency: 150,
            emitting: false,  // 自動的な発生を無効にする
            tint: 0xff0000,
		});
        this.score_daemon_effect = this.add.particles(0, 0, 'star', {
			moveToX: 514,
			moveToY: 87,
			lifespan: 500,
			scale: { start: 1, end: 0.3 },
            alpha: { start: 1, end: 0 },
			frequency: 150,
            tint: 0x0000ff,
            emitting: false,
		});

        this.scene.bringToTop('OverwriteScene');

        // イベントリスナーを設定してスコアを更新
        this.game.events.on('update-score', this.updateScore, this);

        this.game.events.on('change2create', this.create_start, this);
        this.game.events.on('change2shooting', this.shooting_start, this);

        this.game.events.on('GameOver', this.GameOver, this);
        
    }

    updateScore(scores) {
        this.score_angel = this.score_angel + scores.plus_score_angel;
        this.score_daemon = this.score_daemon + scores.plus_score_daemon;
        this.score_particleEmit(scores.side, scores.amount, scores.x, scores.y);
        
    }

    score_particleEmit(side,amount, x, y){
        x = 48 + 0.84 * x ;
        y = 128 + 0.84 * y ;

        if (side == "angel"){
            this.score_angel_effect.emitParticleAt(x,y,amount);
        } else {
            this.score_daemon_effect.emitParticleAt(x,y,amount);
        }
        this.drawScoreGauge();
    }

    drawScoreGauge(score_angel,score_daemon) {
        // ドーナツの中心座標と半径
        const centerX = 514;
        const centerY = 87;
        const outerRadius = 77;
        const innerRadius = 56;

        // スコアに基づいて角度を計算

        // 合計スコアが暫定上限を超えた時は上限を置き直す !?
        if (this.score_angel + this.score_daemon >= this.maxScore){
            this.maxScore = this.score_angel + this.score_daemon;
            if (this.score_angel > this.score_daemon && this.endFlag != 1){
                if(this.endFlag == 2){this.victory_effect.stop();}
                this.endFlag = 1;
                this.victory_effect = this.add.particles(514,87,'star',{
                    speed: { min: -100, max: 100 },  // 速度をランダムに設定して動きを自然に
                    scale: { start: 0.5, end: 0 },
                    //blendMode: 'ADD',
                    lifespan: 1000,  // パーティクルの寿命
                    emitZone: {
                        type: 'edge',  // 'edge'を使用して円の端から放出
                        source: new Phaser.Geom.Circle(0, 0, 60),  // 放出される円の大きさ
                        quantity: 45,
                        stepRate: 20,
                        yoyo: false
                    },
                    rotate: { start: 0, end: 360 },  // パーティクル自身も回転させる
                    on: false,  // 自動放出はオフに
                    tint: 0xff6666, // 色を染める
                });
            }else if(this.score_daemon >= this.score_angel && this.endFlag != 2){
                if(this.endFlag == 1){this.victory_effect.stop();}
                this.endFlag = 2;
                this.victory_effect = this.add.particles(514,87,'star',{
                    speed: { min: -100, max: 100 },  // 速度をランダムに設定して動きを自然に
                    scale: { start: 0.5, end: 0 },
                    //blendMode: 'ADD',
                    lifespan: 1000,  // パーティクルの寿命
                    emitZone: {
                        type: 'edge',  // 'edge'を使用して円の端から放出
                        source: new Phaser.Geom.Circle(0, 0, 60),  // 放出される円の大きさ
                        quantity: 45,
                        stepRate: 20,
                        yoyo: false
                    },
                    rotate: { start: 0, end: 360 },  // パーティクル自身も回転させる
                    on: false,  // 自動放出はオフに
                    tint: 0x1111ff, // 色を染める
                });
            }
        }

        // スーパーおもしろギャグ->angle_angel
        // ゲージ下部の欠け50度分を考慮し、全周を310度としたときの角度に換算
        var startAngle_angel = Phaser.Math.DegToRad(115);
        var endAngle_angel = Phaser.Math.DegToRad(310 * this.score_angel / this.maxScore + 115);
        var startAngle_daemon = Phaser.Math.DegToRad(65);
        var endAngle_daemon = Phaser.Math.DegToRad(65 - 310 * this.score_daemon / this.maxScore);
        
        // グラフィックスをクリアして新たに描画
        
        this.scoreGauge_angel.clear();
        this.scoreGauge_angel.fillStyle(0xcf4853, 1); // 赤色で不透明
        this.scoreGauge_angel.beginPath();
        this.scoreGauge_angel.arc(centerX, centerY, outerRadius, startAngle_angel, endAngle_angel, false);
        this.scoreGauge_angel.lineTo(centerX + innerRadius * Math.cos(endAngle_angel), centerY + innerRadius * Math.sin(endAngle_angel));
        this.scoreGauge_angel.arc(centerX, centerY, innerRadius, endAngle_angel, startAngle_angel, true);
        this.scoreGauge_angel.lineTo(centerX + outerRadius * Math.cos(startAngle_angel), centerY + outerRadius * Math.sin(startAngle_angel));
        this.scoreGauge_angel.closePath();
        this.scoreGauge_angel.fillPath();

        this.scoreGauge_daemon.clear();
        this.scoreGauge_daemon.fillStyle(0x4f43b9, 1); // 青色で不透明
        this.scoreGauge_daemon.beginPath();
        this.scoreGauge_daemon.arc(centerX, centerY, outerRadius, startAngle_daemon, endAngle_daemon, true);
        this.scoreGauge_daemon.lineTo(centerX + innerRadius * Math.cos(endAngle_daemon), centerY + innerRadius * Math.sin(endAngle_daemon));
        this.scoreGauge_daemon.arc(centerX, centerY, innerRadius, endAngle_daemon, startAngle_daemon, false);
        this.scoreGauge_daemon.lineTo(centerX + outerRadius * Math.cos(startAngle_daemon), centerY + outerRadius * Math.sin(startAngle_daemon));
        this.scoreGauge_daemon.closePath();
        this.scoreGauge_daemon.fillPath();
    }

    updateTimeBar() {
        // 経過時間に基づいてゲージの長さを更新
        this.elapsed = this.elapsed + 100;

        // 時間の経過チェック
        if (this.elapsed >= this.totalDuration) {
            //時間終了
            this.game.events.emit('update-countdown', 0);
            this.timeBar.fillRect(94, 66, 0, 35); // ゲージを0に
            this.timeEvent.remove(); // タイマーイベントを停止
            if (this.score_angel + this.score_daemon >= this.maxScore && this.frame_shooting.visible){
                const gameover_scores = {
                    score_angel: this.score_angel,
                    score_daemon: this.score_daemon,
                    };
                this.game.events.emit('GameOver',gameover_scores);
            }else{
                this.game.events.emit('Timeup');
            }
        } else if (this.elapsed >= this.totalDuration - 1000) {
            //1秒前
            this.game.events.emit('update-countdown', 1);
        } else if (this.elapsed >= this.totalDuration - 2000) {
            //2秒前
            this.game.events.emit('update-countdown', 2);
        } else if (this.elapsed >= this.totalDuration - 3000) {
            //3秒前
            this.game.events.emit('update-countdown', 3);
        }

        const timeWidth = this.timeWidth_full - (this.timeWidth_full * this.elapsed / this.totalDuration);
        // ゲージを更新
        this.timeBar.clear();
        this.timeBar.fillStyle(0x4ac8a1, 1);
        this.timeBar.fillRect(94, 66, timeWidth, 35);
    
    }
    create_start(){
        this.elapsed = 0; //Scene内の累計経過時間（ミリ秒）
        this.totalDuration = 30000; // 持ち時間
        this.timeEvent.remove();
        this.scene.bringToTop('OverwriteScene');
        this.frame_shooting.setVisible(false);
        this.frame_making.setVisible(true);
        // タイマーイベントの設定
        this.timeEvent = this.time.addEvent({
            delay: 100, // 0.1秒ごとに更新
            callback: this.updateTimeBar,
            callbackScope: this,
            loop: true
        });
    }
    shooting_start(){
        this.elapsed = 0; //Scene内の累計経過時間（ミリ秒）
        this.totalDuration = 30000; // 持ち時間
        this.timeEvent.remove();
        this.scene.bringToTop('OverwriteScene');
        this.frame_shooting.setVisible(true);
        this.frame_making.setVisible(false);
        // タイマーイベントの設定
        this.timeEvent = this.time.addEvent({
            delay: 100, // 0.1秒ごとに更新
            callback: this.updateTimeBar,
            callbackScope: this,
            loop: true
        });
    }
    GameOver() {
        // ゲームの動きを止める
        this.scene.bringToTop('OverwriteScene');
        // ゲーム終了時にパーティクルを消滅させる
        this.victory_effect.stop();
        this.physics.pause();
    }
}
// OverwriteScene: どうしてもgame側の上に載せたい情報を管理 FrameSceneのdepthを管理してもstartしたgameがSceneごと上に来ちゃうため
class OverwriteScene extends Phaser.Scene {
    constructor() {
        super('OverwriteScene');
    }
    create() {
        // カウントダウン用のテキストオブジェクトの設置
        this.countdownText = this.add.text(300, 400, '', {
            fontSize: '100px',
            color: '#ff5555',
            fontFamily: 'Corporate-Logo-Rounded-Bold',
            align: 'center',
            stroke: '#ffffff',      // 縁取りの色
            strokeThickness: 6      // 縁取りの太さ
        });
        this.countdownText.setOrigin(0.5);
        this.countdownText.setVisible(false);

        // イベントリスナーの登録
        this.game.events.on('change2create', this.create_start, this);
        this.game.events.on('change2shooting', this.shooting_start, this);
        this.game.events.on('update-countdown', this.updateCountdown, this);
        this.game.events.on('GameOver', this.GameOver, this);
        const description_making = this.add.image(300,450,'description_making').setScale(3).setAlpha(0);
        this.tweens.add({
            targets: description_making,
            alpha: 1, // 不透明度を1に
            scale: 0.5,
            duration: 500, // アニメーション時間
            ease: 'power2', // イージング
            onComplete: () => {
                // アニメーションが完了した後、3秒後にオブジェクトを削除する
                this.time.delayedCall(2000, function() {
                    description_making.destroy(); // オブジェクトを削除
                    description_making.setVisible(false);
                }, [], this);
                },
                //callbackScope: this  // コールバック関数のスコープを設定
        });
    }

    updateCountdown(time){
        if (time > 0) {
            this.countdownText.setText(time.toString());
            this.countdownText.setVisible(true);
        } else {
            this.countdownText.setVisible(false);
        }
    }
    create_start(){
        const description_making = this.add.image(300,450,'description_making').setScale(3).setAlpha(0);
        this.tweens.add({
            targets: description_making,
            alpha: 1, // 不透明度を1に
            scale: 0.5,
            duration: 500, // アニメーション時間
            ease: 'power2', // イージング
            onComplete: () => {
                // アニメーションが完了した後、3秒後にオブジェクトを削除する
                this.time.delayedCall(2000, function() {
                    description_making.destroy(); // オブジェクトを削除
                    description_making.setVisible(false);
                }, [], this);
                },
                //callbackScope: this  // コールバック関数のスコープを設定
        });
    }
    shooting_start(){
        const description_shooting = this.add.image(300,450,'description_shooting').setScale(3).setAlpha(0);
        this.tweens.add({
            targets: description_shooting,
            alpha: 1, // 不透明度を1に
            scale: 0.5,
            duration: 500, // アニメーション時間
            ease: 'power2', // イージング
            onComplete: () => {
                // アニメーションが完了した後、3秒後にオブジェクトを削除する
                this.time.delayedCall(2000, function() {
                    description_shooting.destroy(); // オブジェクトを削除
                    description_shooting.setVisible(false);
                }, [], this);
                },
                //callbackScope: this  // コールバック関数のスコープを設定
        });
    }
    GameOver(gameover_scores){
        // ゲームの動きを止める
        this.physics.pause();
        
        // 暗転用の黒い四角形を画面全体に表示
        let blackRect = this.add.rectangle(0, 0, 600, 800, 0x000000, 0.8).setOrigin(0, 0);



        if(gameover_scores.score_angel>gameover_scores.score_daemon){
            const result1 = this.add.text(300, 100, 'YOU WON！', {
                fontSize: '64px',
                color: '#ff5555',
                fontFamily: 'Corporate-Logo-Rounded-Bold',
                align: 'center',
                stroke: '#ffffff',      // 縁取りの色
                strokeThickness: 6      // 縁取りの太さ
            });
            result1.setOrigin(0.5,0.5);
            const result2 = this.add.text(300, 180, 'エンジェリック・シャイニーレッドの勝ち', {
                fontSize: '32px',
                color: '#ff5555',
                fontFamily: 'Corporate-Logo-Rounded-Bold',
                align: 'center',
                stroke: '#ffffff',      // 縁取りの色
                strokeThickness: 3      // 縁取りの太さ
            });
            result2.setOrigin(0.5,0.5);
            const michael_Result = this.add.sprite(150, 650, 'michael_wink').setScale(0.5);
            const bubble_Result = this.add.sprite(420,600,'bubble').setScale(0.5);
            const result3 = this.add.text(430, 597, 'やった！ 大勝利です！', {
                fontSize: '16px',
                color: '#222222',
                fontFamily: 'Corporate-Logo-Rounded-Bold',
                align: 'center',
            });
            result3.setOrigin(0.5,0.5);

        }else{
            const result1 = this.add.text(300, 100, 'YOU LOSE...', {
                fontSize: '64px',
                color: '#5555ff',
                fontFamily: 'Corporate-Logo-Rounded-Bold',
                align: 'center',
                stroke: '#ffffff',      // 縁取りの色
                strokeThickness: 6      // 縁取りの太さ
            });
            result1.setOrigin(0.5,0.5);
            const result2 = this.add.text(300, 180, 'デビリッシュ・ダークブルーの勝ち', {
                fontSize: '32px',
                color: '#5555ff',
                fontFamily: 'Corporate-Logo-Rounded-Bold',
                align: 'center',
                stroke: '#ffffff',      // 縁取りの色
                strokeThickness: 3      // 縁取りの太さ
            });
            result2.setOrigin(0.5,0.5);
            const michael_Result = this.add.sprite(150, 650, 'michael_lose').setScale(0.5);
            const bubble_Result = this.add.sprite(420,600,'bubble').setScale(0.5);
            const result3 = this.add.text(430, 597, '負けちゃいましたけど、\n楽しかったです!', {
                fontSize: '16px',
                color: '#222222',
                fontFamily: 'Corporate-Logo-Rounded-Bold',
                align: 'center',
            });
            result3.setOrigin(0.5,0.5);
        }
        // ゲームオーバーテキストの表示

        const result3 = this.add.text(300, 250, `集めた祝福: ${gameover_scores.score_angel}`, {
            fontSize: '28px',
            fill: '#FFFFFF',

            fontFamily: 'Corporate-Logo-Rounded-Bold',
        });
        result3.setOrigin(0.5,0.5);

        let retryText = this.add.text(300, 330,'もう一度挑戦する', {
            fontSize: '24px',
            fill: '#9999FF',
            fontFamily: 'Corporate-Logo-Rounded-Bold',
        })
        .setSize(24)
        .on('pointerover', function() {
            retryText.setStyle({ fill: '#ff0' });  // マウスオーバー時に色を変更
        })
        .on('pointerout', function() {
            retryText.setStyle({ fill: '#99f' });  // マウスアウト時に元の色に戻す
        })
        .setOrigin(0.5,0.5)
        .setPadding(0, 4, 0, 0); //日本語の上部の文字欠けを強引に解決するpadding

        this.tweens.add({
            targets: retryText,
            scale: 1.1,
            duration: 500,
            yoyo: true,
            repeat: -1
        });
        

        retryText.setInteractive({ useHandCursor: true });
        retryText.on('pointerdown', () => {
            this.reload_all();
        });

        // Twitterシェアボタン（ここではテキストで代用）
        let shareText = this.add.text(220, 400, 'Twitterにシェア', {
            fontSize: '24px',
            fill: '#0080FF' ,
            fontFamily: 'Corporate-Logo-Rounded-Bold',
        })

        .setSize(24)

        .setPadding(0, 4, 0, 0); //日本語の上部の文字欠けを強引に解決するpadding

        shareText.setInteractive({ useHandCursor: true });
        shareText.on('pointerdown', () => {
            this.shareOnTwitter(gameover_scores.score_angel);
        });

    }
    shareOnTwitter(score) {
        const gameurl =`https://crashfever.com/campaign/`
        const tweetText = `エンジェリック・シャイニーレッドで祝福を${score}集めた！ #ミカエルの雪玉補給大作戦\n${gameurl}`;
        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
        //window.open(url, '_blank'); //PCの場合はこっちにするのが望ましい 
        window.open(url, '_self');//モバイルのポップアップブロックを受けないのはこっち
    }
    reload_all() {
        this.game.destroy(true); // ゲームインスタンスを破棄
        window.location.reload(); // ページをリロードして全てをリセット
    }
}

class OpeningScene extends Phaser.Scene {
    constructor() {
        super({ key: 'OpeningScene' });
    }

    preload() {
        this.load.image('player', 'assets/player.png'); // プレイヤーの画像
        this.load.image('allyBullet_s', 'assets/snowball_s.png'); // 弾の画像
        this.load.image('allyBullet_m', 'assets/snowball_m.png'); // 弾の画像
        this.load.image('allyBullet_l', 'assets/snowball_l.png'); // 弾の画像
        this.load.image('enemy', 'assets/enemy.png'); //暫定の敵の画像
        this.load.image('ally', 'assets/player.png'); // 暫定の味方の画像
        this.load.image('enemyBullet_s', 'assets/snowball_s.png'); // 敵の弾の画像
        this.load.image('enemyBullet_m', 'assets/snowball_m.png'); // 敵の弾の画像
        this.load.image('enemyBullet_l', 'assets/snowball_l.png'); // 敵の弾の画像
        this.load.image('shark', 'assets/shark.png'); // 敵の弾の画像
        this.load.image('sandalphon', 'assets/ally1.png'); // サンダルフォンの画像
        this.load.image('uriel', 'assets/ally2.png'); // ウリエルの画像
        this.load.image('gabriel', 'assets/ally3.png'); // ガブリエルの画像
        this.load.image('satan', 'assets/enemy.png'); // サタンの画像
        this.load.image('forneus', 'assets/enemy2.png'); // フォルネウスの画像
        this.load.image('amon', 'assets/enemy3.png'); // アモンの画像
        this.load.image('charge_1', 'assets/charge_1.png'); //チャージ中のアニメーション画像
        this.load.image('charge_2', 'assets/charge_2.png');
        this.load.image('charge_3', 'assets/charge_3.png');
        this.load.image('charge_4', 'assets/charge_4.png');
        this.load.image('snow_particle', 'assets/snow_particle.png'); //雪玉パーティクル

        this.load.image('table', 'assets/table.png'); // テーブルの画像
        this.load.image('bubble', 'assets/balloon.png'); // 吹き出しの画像

        this.load.image('description_shooting', 'assets/description_shooting.png'); // よけろ！
        this.load.image('description_making', 'assets/description_making.png'); // つくれ！

        this.load.image('michael_idle1', 'assets/michael_idle1.png');
        this.load.image('michael_idle2', 'assets/michael_idle2.png');
        this.load.image('michael_idle3', 'assets/michael_idle3.png');
        this.load.image('michael_wink', 'assets/michael_wink.png');
        this.load.image('michael_lose', 'assets/michael_lose.png');
        this.load.image('michael_makingSnowball1', 'assets/michael_makingSnowball1.png');
        this.load.image('michael_makingSnowball2', 'assets/michael_makingSnowball2.png');
        this.load.image('michael_makingSnowball3', 'assets/michael_makingSnowball3.png');

        this.load.image('frame_shooting', 'assets/frame_shooting.png');
        this.load.image('frame_making', 'assets/frame_making.png');
        this.load.image('button_howtoplay', 'assets/button_howtoplay.png');
        this.load.image('button_play', 'assets/button_play.png');
        this.load.image('description_shooting', 'assets/description_shooting.png');
        this.load.image('description_making', 'assets/description_making.png');

        this.load.image('star', 'assets/charge_4.png'); 
        this.load.image('title', 'assets/title.png');
        this.load.image('top_background', 'assets/top_background.png'); 
        this.load.audio('bgm', 'assets/bgm.wav');
        this.load.audio('hit_se1','assets/hit_1.wav');
        this.load.audio('hit_se2','assets/hit_2.wav');
        this.load.audio('bad_se','assets/bad.wav');
        this.load.audio('nice_se','assets/nice.wav');

        this.load.image('sandalphon_cutin','assets/sandalphon_cutin.png');
        this.load.image('gabriel_cutin','assets/gabriel_cutin.png');
        this.load.image('uriel_cutin','assets/uriel_cutin.png');
        this.load.image('gradation','assets/gradation.png');
    }

    create() {
        // トップ画面を作成
        this.background = this.add.image(300,400,'top_background').setScale(0.5);
        this.michael_opening = this.add.sprite(100, 430, 'michael_idle1').setScale(1.15);
        this.title = this.add.image(300,500,'title').setScale(0.5).setAlpha(0);
        //this.title.setOrigin(0.5,1);
        // 下からスライドしながらフェードインするアニメーション
        this.tweens.add({
            targets: this.title,
            y: 200, // 最終的なy座標
            alpha: 1, // 不透明度を1に
            duration: 2000, // アニメーション時間
            ease: 'Bounce', // イージング
        });

        this.music = this.sound.add('bgm',{loop: true, volume:0.1});
        this.music.play();

        this.game.events.on('GameOver', this.GameOver, this);
        
        this.anims.create({
            key: 'michael_idle',
            frames: [
                { key: 'michael_idle1' },
                { key: 'michael_idle2' },
                { key: 'michael_idle3' }
            ],
            frameRate: 3,
            repeat: -1
        });
        this.michael_opening.play('michael_idle', true);
        
        createImageButton(this, 430,600,'button_howtoplay',()=> {
            this.music.stop();
            this.scene.start('HowToPlayScene');
        }) ;

        createImageButton(this, 430,500,'button_play',()=> {
            this.scene.start('FrameScene');
        }) ;

        function createImageButton (scene, x, y, imageKey, callback) {
            let button = scene.add.image(x, y, imageKey).setInteractive().setScale(0.5)
              .on('pointerup', callback) //ボタンの直感的な動作に合わせるために話したときにする
              .on('pointerover', () => button.setTint(0x76b5c5))
              .on('pointerout', () => button.clearTint())
              .on('pointerdown', () => button.setTint(0x5c8ca8)) // ボタンを押している間の色
              .setOrigin(0.5);
        
            return button;
        }

        //プレイグラウンド
    }
    GameOver(){
        this.music.stop();
    }
 }

 class HowToPlayScene extends Phaser.Scene {
    constructor() {
        super({ key: 'HowToPlayScene' });
    }

    create() {
        // 背景画像を表示
        this.background = this.add.image(300, 400, 'top_background').setScale(0.5);
        
        // タイトル
        this.add.text(300, 50, '遊び方', {
            fontSize: '48px',
            fill: '#DD0000',
            fontFamily: 'Corporate-Logo-Rounded-Bold',
            stroke: '#ffffff',      // 縁取りの色
            strokeThickness: 6      // 縁取りの太さ
        })
        .setOrigin(0.5)
        .setPadding(0, 4, 0, 0); //日本語の上部の文字欠けを強引に解決するpadding

        // 世界観の説明
        this.add.text(50, 100, '2023年のクリスマスイベント「天使と悪魔の雪合戦！」において、\n本編に登場しなかったミカエルが、天使チーム「エンジェリック・シャイニーレッド」の\n雪玉補給係だったのではないか？という妄想を形にしたゲームです。\n\nプレイヤーはミカエルになり、天使チームに所属します。\nたくさん雪玉を作って天使チームの勝利を目指し、雪合戦を盛り上げましょう。', {
            fontSize: '16px',
            fill: '#000000',
            wordWrap: { width: 500 },
            fontFamily: 'Corporate-Logo-Rounded-Bold',
        })
        .setPadding(0, 4, 0, 0); //日本語の上部の文字欠けを強引に解決するpadding

        // 操作方法の説明
        this.add.text(50, 250, '操作方法', {
            fontSize: '28px',
            fill: '#DD1500',
            fontFamily: 'Corporate-Logo-Rounded-Bold',
        })
        .setPadding(0, 4, 0, 0); //日本語の上部の文字欠けを強引に解決するpadding

        this.add.text(50, 290, '・マウス操作もしくはタッチ操作のみ使用します。\n・雪玉製作フェーズでは、長押ししてタイミング良く離すことで、雪玉を作ります。\n・雪合戦フェーズでは、画面を左右にスワイプし、飛んでくる雪玉を避けます。', {
            fontSize: '16px',
            fill: '#000000',
            wordWrap: { width: 500 },
            fontFamily: 'Corporate-Logo-Rounded-Bold',
        })
        .setPadding(0, 4, 0, 0); //日本語の上部の文字欠けを強引に解決するpadding

        // ゲームの流れの説明
        this.add.text(50, 370, 'ゲームの流れ', {
            fontSize: '28px',
            fill: '#DD1500',
            fontFamily: 'Corporate-Logo-Rounded-Bold',
        })
        .setPadding(0, 4, 0, 0); //日本語の上部の文字欠けを強引に解決するpadding

        // 雪玉製作フェーズの説明
        this.add.text(50, 410, '雪玉製作フェーズ', {
            fontSize: '20px',
            fill: '#D02D32',
            fontFamily: 'Corporate-Logo-Rounded-Bold',
        })
        .setPadding(0, 4, 0, 0); //日本語の上部の文字欠けを強引に解決するpadding

        this.add.text(50, 440, '・天使AIたちが要求する大きさの雪玉を作成しましょう。\n・1つまで雪玉を自動でキープできます。\n・雪玉を作っている間は手がかじかんでいき、作るのが遅くなっていきます。\n・作った雪玉は、この後の雪合戦フェーズで天使AIたちが使います。', {
            fontSize: '16px',
            fill: '#000000',
            wordWrap: { width: 500 },
            fontFamily: 'Corporate-Logo-Rounded-Bold',
        })
        .setPadding(0, 4, 0, 0); //日本語の上部の文字欠けを強引に解決するpadding

        // 雪合戦フェーズの説明
        this.add.text(50, 540, '雪合戦フェーズ', {
            fontSize: '20px',
            fill: '#D02D32',
            fontFamily: 'Corporate-Logo-Rounded-Bold',
        })
        .setPadding(0, 4, 0, 0); //日本語の上部の文字欠けを強引に解決するpadding

        this.add.text(50, 570, '・天使AIと悪魔AIたちの雪合戦が始まります。\n・ミカエルはあくまで補給係。大量に飛び交う雪玉を避けることに専念しましょう。\n・相手チームに雪玉を当てて雪合戦を盛り上げると、\n  神雪の杯にクリスマスパワーが溜まっていきます。\n・神雪の杯がいっぱいになり、雪合戦の時間が終わったらゲーム終了です。\n・溜めたクリスマスパワーが多いチームの勝利となります。', {
            fontSize: '16px',
            fill: '#000000',
            wordWrap: { width: 500 },
            fontFamily: 'Corporate-Logo-Rounded-Bold',
        })
        .setPadding(0, 4, 0, 0); //日本語の上部の文字欠けを強引に解決するpadding

        let backText = this.add.text(300, 745, '画面タップで戻る', {
            fontSize: '20px',
            fill: '#100D32',
            fontFamily: 'Corporate-Logo-Rounded-Bold',
            stroke: '#ffffff',      // 縁取りの色
            strokeThickness: 1      // 縁取りの太さ
        })
        .setOrigin(0.5)
        .setPadding(0, 4, 0, 0); //日本語の上部の文字欠けを強引に解決するpadding

        this.add.text(590, 790, '詳しくはツイートを参照してください\n#クラコンフリー2024 @kumoridai', {
            fontSize: '12px',
            fill: '#000000',
            fontFamily: 'Corporate-Logo-Rounded-Bold',
        })
        .setOrigin(1)
        .setPadding(0, 4, 0, 0); //日本語の上部の文字欠けを強引に解決するpadding
        // 画面全体をタップで反応させる
        this.input.on('pointerup', () => {
            this.scene.start('OpeningScene');
        });

        this.tweens.add({
            targets: backText,
            scale: 1.1,
            duration: 800,
            yoyo: true,
            repeat: -1
        });
    }
}

const config = {
    type: Phaser.AUTO,
    /*
        ■くもりの一口メモ
        ～モバイル向け&PCでも触れるブラウザゲームのレスポンシブと拡大縮小、解像度対応編～

        デバイスの"ピクセル"として考えるものは、以下の3つの用語が混在している。
        Points, Rendered Pixels, Physical Pixels
    */
    width: 600, //下限750(SE横幅デバイス), 上限1290(iphone15proデバイス),1080くらいが妥当か？(pixel8) 600
    height: 800, // 800 1440
    backgroundColor: 0x0c88c7,
    scale: {
        mode: Phaser.Scale.FIT, //ゲームを親コンテナにフィットさせる設定
        autoCenter: Phaser.Scale.CENTER_BOTH //ゲームを画面中央に配置
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [OpeningScene, HowToPlayScene, FrameScene, OverwriteScene, RhythmScene, ShootingScene] //scene.startで宣言しなくても、ここで最初に示したシーンから起動する
};

const game = new Phaser.Game(config);