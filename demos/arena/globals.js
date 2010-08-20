var ship,
    arena,
    bg,
    viewport,
    width = 800, height = 600,
    px = 0, py = 0,
    angle = 0,
    bulletAngle = 0,
    enemies = [],
    bullets = [],
    waves = [],
    paused = false,

    /* collsion object types */
    CPLAYER = 1,
    CENEMY  = 2,
    CBULLET = 4;
