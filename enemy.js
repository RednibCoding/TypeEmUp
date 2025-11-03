export class Enemy {
    constructor(x, y, word, speed, isBoss = false) {
        this.x = x;
        this.y = y;
        this.word = word;
        this.speed = speed;
        this.isBoss = isBoss;
        this.width = isBoss ? 120 : 40;
        this.height = isBoss ? 80 : 30;
        this.typedChars = 0;
        this.active = false; // Whether player is currently typing this word
        
        // Boss-specific properties
        if (isBoss) {
            this.maxHealth = 5;
            this.health = this.maxHealth;
        }
    }

    update() {
        this.y += this.speed;
    }

    draw(ctx) {
        ctx.save();
        
        // Different colors for boss
        const baseColor = this.isBoss ? '#d47b7b' : '#7bb3d4';
        const highlightColor = this.isBoss ? '#f49b9b' : '#a8d5e2';
        const activeBaseColor = '#d4a87b';
        const activeHighlightColor = '#f4d4a8';
        
        // Enemy ship body
        ctx.fillStyle = this.active ? activeBaseColor : baseColor;
        ctx.strokeStyle = this.active ? activeHighlightColor : highlightColor;
        ctx.lineWidth = this.isBoss ? 3 : 2;
        
        if (this.isBoss) {
            // Boss ship - larger and more detailed
            // Main hull
            ctx.beginPath();
            ctx.moveTo(this.x + this.width / 2, this.y + this.height);
            ctx.lineTo(this.x, this.y + this.height / 3);
            ctx.lineTo(this.x + this.width / 4, this.y);
            ctx.lineTo(this.x + this.width * 3/4, this.y);
            ctx.lineTo(this.x + this.width, this.y + this.height / 3);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            
            // Wings
            ctx.beginPath();
            ctx.moveTo(this.x, this.y + this.height / 3);
            ctx.lineTo(this.x - 20, this.y + this.height / 2);
            ctx.lineTo(this.x, this.y + this.height / 2);
            ctx.fill();
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(this.x + this.width, this.y + this.height / 3);
            ctx.lineTo(this.x + this.width + 20, this.y + this.height / 2);
            ctx.lineTo(this.x + this.width, this.y + this.height / 2);
            ctx.fill();
            ctx.stroke();
            
            // Cockpit
            ctx.fillStyle = this.active ? activeHighlightColor : highlightColor;
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y + this.height / 2, 12, 0, Math.PI * 2);
            ctx.fill();
            
            // Details
            ctx.strokeStyle = this.active ? activeHighlightColor : highlightColor;
            ctx.lineWidth = 2;
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.moveTo(this.x + 20 + i * 30, this.y + 15);
                ctx.lineTo(this.x + 20 + i * 30, this.y + 25);
                ctx.stroke();
            }
            
            // Glow effect
            ctx.shadowBlur = this.active ? 25 : 20;
            ctx.shadowColor = this.active ? 'rgba(244, 212, 168, 0.8)' : 'rgba(212, 123, 123, 0.6)';
        } else {
            // Regular enemy ship
            // Main hull (inverted triangle - pointing down)
            ctx.beginPath();
            ctx.moveTo(this.x + this.width / 2, this.y + this.height);
            ctx.lineTo(this.x, this.y);
            ctx.lineTo(this.x + this.width, this.y);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            
            // Details
            ctx.fillStyle = this.active ? activeHighlightColor : highlightColor;
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y + this.height / 3, 5, 0, Math.PI * 2);
            ctx.fill();
            
            // Wing details
            ctx.strokeStyle = this.active ? activeHighlightColor : highlightColor;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(this.x + 8, this.y + 8);
            ctx.lineTo(this.x + this.width - 8, this.y + 8);
            ctx.stroke();
            
            // Glow effect
            ctx.shadowBlur = this.active ? 20 : 10;
            ctx.shadowColor = this.active ? 'rgba(244, 212, 168, 0.6)' : 'rgba(168, 213, 226, 0.4)';
        }
        
        ctx.strokeStyle = this.active ? activeHighlightColor : highlightColor;
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
        
        ctx.restore();
        
        // Draw health bar for boss
        if (this.isBoss) {
            this.drawBossHealthBar(ctx);
        }
        
        // Draw word below ship
        this.drawWord(ctx);
    }
    
    drawBossHealthBar(ctx) {
        const barWidth = this.width;
        const barHeight = 6;
        const barX = this.x;
        const barY = this.y + this.height + 5; // Position below boss, above word
        
        // Background
        ctx.fillStyle = 'rgba(168, 213, 226, 0.2)';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // Health
        const healthPercent = this.health / this.maxHealth;
        ctx.fillStyle = '#d47b7b';
        ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
        
        // Border
        ctx.strokeStyle = '#f49b9b';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
        
        // Health text
        ctx.save();
        ctx.font = 'bold 10px Courier New';
        ctx.fillStyle = '#f49b9b';
        ctx.textAlign = 'center';
        ctx.fillText(`${this.health}/${this.maxHealth}`, this.x + this.width / 2, barY + barHeight + 2);
        ctx.restore();
    }

    drawWord(ctx) {
        ctx.save();
        ctx.font = this.isBoss ? 'bold 20px Courier New' : 'bold 16px Courier New';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        
        // Position word below health bar for boss, or directly below ship for regular enemy
        const wordY = this.isBoss ? this.y + this.height + 20 : this.y + this.height + 8;
        
        // Typed characters (highlighted)
        if (this.typedChars > 0) {
            const typedText = this.word.substring(0, this.typedChars);
            // Use bright cyan for boss, orange for regular enemies
            ctx.fillStyle = this.isBoss ? '#7bd4d4' : '#d4a87b';
            ctx.shadowBlur = 5;
            ctx.shadowColor = this.isBoss ? 'rgba(123, 212, 212, 0.8)' : 'rgba(212, 168, 123, 0.8)';
            
            // Calculate position for typed text
            const fullWidth = ctx.measureText(this.word).width;
            const typedWidth = ctx.measureText(typedText).width;
            const startX = this.x + this.width / 2 - fullWidth / 2;
            
            ctx.textAlign = 'left';
            ctx.fillText(typedText, startX, wordY);
        }
        
        // Remaining characters
        if (this.typedChars < this.word.length) {
            const remainingText = this.word.substring(this.typedChars);
            ctx.fillStyle = this.isBoss ? '#f49b9b' : '#a8d5e2';
            ctx.shadowBlur = 8;
            ctx.shadowColor = this.isBoss ? 'rgba(244, 155, 155, 0.5)' : 'rgba(168, 213, 226, 0.5)';
            
            const fullWidth = ctx.measureText(this.word).width;
            const typedWidth = this.typedChars > 0 ? ctx.measureText(this.word.substring(0, this.typedChars)).width : 0;
            const startX = this.x + this.width / 2 - fullWidth / 2 + typedWidth;
            
            ctx.textAlign = 'left';
            ctx.fillText(remainingText, startX, wordY);
        }
        
        ctx.restore();
    }

    checkTyping(char) {
        if (this.typedChars < this.word.length && this.word[this.typedChars].toLowerCase() === char.toLowerCase()) {
            this.typedChars++;
            return true;
        }
        return false;
    }

    isComplete() {
        return this.typedChars >= this.word.length;
    }

    hasReachedBottom(canvasHeight) {
        return this.y + this.height >= canvasHeight; // Touch the actual bottom
    }
    
    takeDamage() {
        if (this.isBoss) {
            this.health--;
            return this.health <= 0;
        }
        return true; // Regular enemies die in one hit
    }
    
    resetWord(newWord) {
        this.word = newWord;
        this.typedChars = 0;
        this.active = false;
    }
}

// Word bank for enemies
export const WORD_BANK = [
    // Easy words (3-5 letters)
    'sky', 'star', 'moon', 'sun', 'mars', 'ship', 'void', 'beam',
    'core', 'lens', 'wave', 'ring', 'nova', 'atom', 'flux', 'bolt',
    'data', 'code', 'byte', 'node', 'port', 'link', 'scan', 'grid',
    'fire', 'ice', 'wind', 'rock', 'metal', 'glass', 'steel', 'iron',
    'gold', 'silver', 'bronze', 'titan', 'omega', 'alpha', 'beta', 'gamma',
    'delta', 'sigma', 'theta', 'pulse', 'sonic', 'radar', 'laser', 'maser',
    'field', 'force', 'power', 'speed', 'light', 'dark', 'shade', 'glow',
    'zero', 'one', 'two', 'echo', 'fox', 'hawk', 'wolf', 'bear',
    'lion', 'eagle', 'shark', 'snake', 'tiger', 'drake', 'storm', 'frost',
    'blaze', 'spark', 'chill', 'vapor', 'dust', 'sand', 'stone', 'earth',
    'spike', 'blade', 'arrow', 'spear', 'sword', 'axe', 'bow', 'gun',
    'path', 'road', 'gate', 'door', 'wall', 'tower', 'dome', 'arch',
    'ray', 'orb', 'gem', 'rune', 'myth', 'sage', 'mage', 'fury',
    'rage', 'hope', 'doom', 'fate', 'soul', 'mind', 'zone', 'aura',
    'veil', 'mask', 'relic', 'coin', 'shard', 'helm', 'cape', 'wing',
    'tail', 'fang', 'claw', 'horn', 'beak', 'talon', 'scale', 'shell',
    'peak', 'cave', 'lake', 'river', 'ocean', 'sea', 'bay', 'gulf',
    'isle', 'reef', 'coast', 'shore', 'beach', 'cliff', 'ridge', 'slope',
    'pass', 'trail', 'mount', 'hill', 'vale', 'glen', 'moor', 'heath',
    'field', 'plain', 'mesa', 'butte', 'dune', 'oasis', 'delta', 'fjord',
    'comet', 'orbit', 'space', 'time', 'warp', 'jump', 'leap', 'dive',
    'rush', 'dash', 'blast', 'burst', 'flash', 'crack', 'boom', 'bang',
    'crash', 'smash', 'break', 'split', 'slice', 'cut', 'chop', 'hack',
    'burn', 'char', 'melt', 'freeze', 'solid', 'liquid', 'gas', 'plasma',
    'volt', 'watt', 'amp', 'ohm', 'joule', 'hertz', 'lux', 'byte',
    'pixel', 'voxel', 'mesh', 'poly', 'curve', 'edge', 'face', 'vertex',
    'prime', 'chaos', 'order', 'law', 'rule', 'code', 'key', 'lock',
    'seal', 'ward', 'charm', 'curse', 'bless', 'hex', 'jinx', 'luck',
    
    // Medium words (6-8 letters)
    'galaxy', 'nebula', 'comet', 'planet', 'rocket', 'plasma',
    'photon', 'quasar', 'pulsar', 'meteor', 'cosmos', 'fusion',
    'engine', 'shield', 'thrust', 'vector', 'binary', 'circuit',
    'network', 'system', 'matrix', 'digital', 'virtual', 'crystal',
    'diamond', 'emerald', 'sapphire', 'quantum', 'nuclear', 'stellar',
    'solar', 'lunar', 'orbital', 'cosmic', 'astral', 'station',
    'outpost', 'command', 'control', 'defense', 'offense', 'mission',
    'reactor', 'turbine', 'booster', 'thruster', 'scanner', 'sensor',
    'beacon', 'signal', 'carrier', 'cruiser', 'frigate', 'corvette',
    'fighter', 'bomber', 'stealth', 'phantom', 'horizon', 'eclipse',
    'equinox', 'solstice', 'zenith', 'nadir', 'velocity', 'momentum',
    'inertia', 'gravity', 'entropy', 'energy', 'photonic', 'neutron',
    'proton', 'electron', 'particle', 'molecule', 'element', 'compound',
    'isotope', 'nucleus', 'spectrum', 'radiant', 'thermal', 'kinetic',
    'magnetic', 'electric', 'static', 'dynamic', 'organic', 'synthetic',
    'metallic', 'ceramic', 'polymer', 'alloy', 'composite', 'hybrid',
    'protocol', 'sequence', 'pattern', 'cipher', 'encoded', 'decoded',
    'syntax', 'logic', 'boolean', 'integer', 'decimal', 'fragment',
    'archive', 'database', 'memory', 'storage', 'backup', 'restore',
    'upload', 'download', 'transfer', 'stream', 'buffer', 'cache',
    'compile', 'execute', 'runtime', 'kernel', 'module', 'library',
    'function', 'method', 'variable', 'constant', 'pointer', 'array',
    'string', 'object', 'class', 'struct', 'union', 'enum',
    'interface', 'abstract', 'inherit', 'override', 'virtual', 'static',
    'public', 'private', 'package', 'import', 'export', 'default',
    'android', 'cyborg', 'robot', 'drone', 'mech', 'golem',
    'sentinel', 'guardian', 'warden', 'keeper', 'hunter', 'seeker',
    'tracker', 'stalker', 'prowler', 'ranger', 'scout', 'recon',
    'assault', 'strike', 'charge', 'engage', 'combat', 'battle',
    'warfare', 'tactics', 'strategy', 'maneuver', 'flank', 'ambush',
    'retreat', 'advance', 'defend', 'attack', 'invade', 'conquer',
    'capture', 'secure', 'occupy', 'hold', 'breach', 'pierce',
    'shatter', 'rupture', 'fracture', 'splinter', 'crumble', 'collapse',
    'implode', 'explode', 'detonate', 'ignite', 'combust', 'incinerate',
    'vaporize', 'disintegrate', 'atomize', 'pulverize', 'crush', 'grind',
    'tornado', 'cyclone', 'typhoon', 'hurricane', 'tempest', 'monsoon',
    'blizzard', 'avalanche', 'landslide', 'earthquake', 'tsunami', 'volcano',
    'inferno', 'wildfire', 'firestorm', 'maelstrom', 'whirlpool', 'vortex',
    'abyss', 'chasm', 'crater', 'canyon', 'ravine', 'gorge',
    'fortress', 'citadel', 'bastion', 'rampart', 'bulwark', 'bunker',
    'arsenal', 'armory', 'depot', 'hangar', 'dockyard', 'shipyard',
    'foundry', 'forge', 'smithy', 'workshop', 'factory', 'refinery',
    'laboratory', 'facility', 'complex', 'compound', 'installation', 'base',
    'nexus', 'hub', 'center', 'junction', 'crossroad', 'waypoint',
    'landmark', 'monument', 'obelisk', 'pillar', 'column', 'spire',
    'pinnacle', 'summit', 'apex', 'crest', 'crown', 'throne',
    'scepter', 'orb', 'regalia', 'emblem', 'insignia', 'badge',
    'medallion', 'talisman', 'amulet', 'pendant', 'locket', 'brooch',
    
    // Hard words (9-12 letters)
    'asteroid', 'satellite', 'celestial', 'supernova', 'interstellar',
    'antimatter', 'wormhole', 'blackhole', 'dimension', 'starship',
    'hyperspace', 'spacetime', 'singularity', 'cosmology', 'astronomy',
    'navigation', 'propulsion', 'combustion', 'radiation', 'trajectory',
    'battleship', 'destroyer', 'dreadnought', 'interceptor', 'annihilator',
    'devastator', 'obliterator', 'terminator', 'dominator', 'liberator',
    'expedition', 'exploration', 'civilization', 'federation', 'empire',
    'rebellion', 'resistance', 'alliance', 'coalition', 'armada',
    'technology', 'machinery', 'mechanism', 'apparatus', 'construct',
    'chronometer', 'spectrometer', 'accelerator', 'generator', 'oscillator',
    'calculator', 'simulator', 'processor', 'amplifier', 'transmitter',
    'receiver', 'modulator', 'regulator', 'stabilizer', 'converter',
    'transformer', 'capacitor', 'resistor', 'conductor', 'insulator',
    'wavelength', 'frequency', 'amplitude', 'resonance', 'interference',
    'diffraction', 'reflection', 'refraction', 'absorption', 'emission',
    'ionization', 'excitation', 'activation', 'deactivation', 'calibration',
    'compression', 'expansion', 'contraction', 'elongation', 'distortion',
    'fragmentation', 'integration', 'segregation', 'aggregation', 'migration',
    'infiltration', 'extraction', 'penetration', 'incursion', 'invasion',
    'occupation', 'liberation', 'evacuation', 'deployment', 'mobilization',
    'fortification', 'barricade', 'stockpile', 'ammunition', 'ordnance',
    'artillery', 'ballistic', 'projectile', 'explosive', 'detonation',
    'shockwave', 'concussion', 'reverberation', 'resonator', 'harmonic',
    'supersonic', 'hypersonic', 'subsonic', 'transonic', 'ultrasonic',
    'electromagnetic', 'electrostatic', 'thermonuclear', 'geothermal', 'biochemical',
    'hydroelectric', 'aerodynamic', 'hydrodynamic', 'thermodynamic', 'photodynamic',
    'crystalline', 'amorphous', 'polymorphic', 'isomorphic', 'metamorphic',
    'cataclysmic', 'catastrophic', 'apocalyptic', 'devastating', 'overwhelming',
    'unstoppable', 'invincible', 'indomitable', 'formidable', 'relentless',
    'persistent', 'tenacious', 'aggressive', 'ferocious', 'merciless',
    'ruthless', 'remorseless', 'pitiless', 'heartless', 'callous',
    'calculation', 'computation', 'algorithm', 'encryption', 'decryption',
    'compression', 'decompression', 'optimization', 'maximization', 'minimization',
    'randomization', 'normalization', 'standardization', 'generalization', 'specialization',
    'implementation', 'declaration', 'instantiation', 'initialization', 'termination',
    'collaboration', 'cooperation', 'coordination', 'synchronization', 'integration',
    'constellation', 'planetarium', 'observatory', 'telescope', 'microscope',
    'spectrograph', 'chromatograph', 'seismograph', 'oscilloscope', 'stethoscope',
    'barometer', 'thermometer', 'hygrometer', 'altimeter', 'speedometer',
    'tachometer', 'odometer', 'anemometer', 'radiometer', 'photometer',
    'incandescent', 'luminescent', 'fluorescent', 'phosphorescent', 'iridescent',
    'translucent', 'transparent', 'opaque', 'reflective', 'refractive',
    'combustible', 'flammable', 'inflammable', 'explosive', 'corrosive',
    'radioactive', 'conductive', 'insulative', 'magnetic', 'electric',
    'turbulence', 'convection', 'conduction', 'radiation', 'evaporation',
    'condensation', 'precipitation', 'sublimation', 'crystallization', 'solidification',
    
    // Very hard words (13+ letters)
    'extraterrestrial', 'electromagnetic', 'astrophysics', 'thermodynamics',
    'supercomputer', 'telecommunications', 'interdimensional', 'consciousness',
    'configuration', 'transformation', 'initialization', 'synchronization',
    'decentralized', 'compartmentalized', 'revolutionary', 'extraordinary',
    'unidentified', 'indistinguishable', 'incomprehensible', 'interplanetary',
    'photosynthesis', 'bioluminescence', 'crystallization', 'vaporization',
    'solidification', 'liquefaction', 'stratification', 'purification',
    'magnification', 'amplification', 'multiplication', 'diversification',
    'experimentation', 'implementation', 'administration', 'communication',
    'transportation', 'classification', 'specification', 'investigation',
    'demonstration', 'manifestation', 'representation', 'presentation',
    'interpretation', 'appreciation', 'consideration', 'determination',
    'differentiation', 'disintegration', 'reintegration', 'reconstruction',
    'reorganization', 'reconfiguration', 'reconstitution', 'reestablishment',
    'superconductor', 'semiconductor', 'microprocessor', 'nanoprocessor',
    'biotechnology', 'nanotechnology', 'cryotechnology', 'pyrotechnology',
    'championship', 'commandership', 'battlecruiser', 'reconnaissance',
    'juggernautical', 'catastrophical', 'astronomical', 'technological',
    'chronological', 'archaeological', 'genealogical', 'mythological',
    'meteorological', 'psychological', 'philosophical', 'physiological',
    'alphabetically', 'chronologically', 'systematically', 'automatically',
    'authentication', 'authorization', 'certification', 'verification',
    'identification', 'clarification', 'qualification', 'quantification',
    'personification', 'simplification', 'beautification', 'glorification',
    'infrastructure', 'superstructure', 'substructure', 'microstructure',
    'circumference', 'interference', 'transcendence', 'independence',
    'unprecedented', 'unparalleled', 'unsubstantiated', 'unprecedented',
    'incandescence', 'luminescence', 'effervescence', 'obsolescence',
    'misconception', 'preconception', 'introspection', 'retrospection',
    'circumvention', 'intervention', 'reinvention', 'misrepresentation'
];

// Boss words - challenging words
export const BOSS_WORDS = [
    'dreadnought', 'annihilator', 'devastator', 'obliterator',
    'battlecruiser', 'superdreadnought', 'juggernaut', 'leviathan',
    'behemoth', 'colossus', 'titan', 'monstrosity', 'abomination',
    'cataclysm', 'apocalypse', 'armageddon', 'ragnarok', 'terminus',
    'extinction', 'oblivion', 'annihilation', 'decimation', 'eradication',
    'extermination', 'subjugation', 'domination', 'supremacy', 'sovereignty',
    'hegemony', 'tyranny', 'oppression', 'subjection', 'enslavement',
    'catastrophe', 'calamity', 'disaster', 'devastation', 'destruction',
    'ruination', 'havoc', 'chaos', 'pandemonium', 'mayhem',
    'conflagration', 'incineration', 'immolation', 'disintegration', 'vaporization',
    'pulverization', 'atomization', 'fragmentation', 'obliteration', 'annihilative',
    'inexorable', 'implacable', 'unstoppable', 'invincible', 'indestructible',
    'impenetrable', 'impregnable', 'insurmountable', 'unconquerable', 'unassailable',
    'overwhelming', 'overpowering', 'omnipotent', 'omniscient', 'omnipresent',
    'unfathomable', 'incomprehensible', 'indescribable', 'unimaginable', 'inconceivable',
    'unprecedented', 'unparalleled', 'unmatched', 'unrivaled', 'unsurpassed',
    'formidable', 'intimidating', 'terrifying', 'horrifying', 'nightmarish',
    'malevolent', 'malignant', 'sinister', 'nefarious', 'diabolical',
    'tyrannical', 'despotic', 'autocratic', 'totalitarian', 'authoritarian',
    'antediluvian', 'primordial', 'prehistoric', 'archaic', 'ancient',
    'monstrous', 'gargantuan', 'colossal', 'gigantic', 'mammoth',
    'tremendous', 'prodigious', 'astronomical', 'stupendous', 'phenomenal',
    'cataclysmic', 'catastrophic', 'apocalyptic', 'devastating', 'ruinous',
    'calamitous', 'disastrous', 'destructive', 'lethal', 'deadly',
    'murderous', 'genocidal', 'homicidal', 'suicidal', 'fratricidal',
    'venomous', 'poisonous', 'toxic', 'virulent', 'pestilent',
    'contagious', 'infectious', 'epidemic', 'pandemic', 'endemic',
    'insidious', 'pernicious', 'deleterious', 'detrimental', 'injurious',
    'baneful', 'baleful', 'maleficent', 'malicious', 'vicious',
    'ferocious', 'savage', 'brutal', 'barbaric', 'ruthless',
    'merciless', 'pitiless', 'remorseless', 'relentless', 'unforgiving',
    'vindictive', 'vengeful', 'spiteful', 'hateful', 'wrathful',
    'furious', 'enraged', 'incensed', 'infuriated', 'livid',
    'tempestuous', 'turbulent', 'chaotic', 'anarchic', 'lawless',
    'rampant', 'raging', 'frenzied', 'berserk', 'maniacal',
    'demented', 'deranged', 'insane', 'lunatic', 'psychotic',
    'sadistic', 'masochistic', 'nihilistic', 'anarchistic', 'antagonistic',
    'belligerent', 'bellicose', 'pugnacious', 'combative', 'aggressive',
    'hostile', 'adversarial', 'oppositional', 'confrontational', 'contentious',
    'quarrelsome', 'argumentative', 'disputatious', 'litigious', 'controversial',
    'incendiary', 'inflammatory', 'provocative', 'antagonizing', 'agitating',
    'disturbing', 'unsettling', 'disquieting', 'alarming', 'frightening',
    'ominous', 'foreboding', 'menacing', 'threatening', 'sinister',
    'macabre', 'gruesome', 'ghastly', 'hideous', 'monstrous',
    'abhorrent', 'repugnant', 'repulsive', 'revolting', 'disgusting',
    'abominable', 'detestable', 'despicable', 'contemptible', 'deplorable',
    'egregious', 'flagrant', 'blatant', 'glaring', 'obvious',
    'conspicuous', 'prominent', 'salient', 'striking', 'remarkable',
    'extraordinary', 'exceptional', 'phenomenal', 'spectacular', 'magnificent',
    'resplendent', 'radiant', 'luminous', 'incandescent', 'effulgent',
    'blazing', 'flaming', 'burning', 'scorching', 'searing',
    'blistering', 'withering', 'devastating', 'crushing', 'pulverizing',
    'annihilating', 'obliterating', 'eradicating', 'exterminating', 'eliminating',
    'liquidating', 'decimating', 'slaughtering', 'massacring', 'butchering',
    'vanquishing', 'conquering', 'subjugating', 'dominating', 'overwhelming',
    'overpowering', 'surmounting', 'transcending', 'surpassing', 'exceeding',
    'outmatching', 'outclassing', 'outperforming', 'outdoing', 'excelling'
];

export function getRandomWord(difficulty = 1, excludedWords = []) {
    let wordPool;
    
    if (difficulty <= 3) {
        // Early rounds: easy words
        wordPool = WORD_BANK.filter(w => w.length <= 5);
    } else if (difficulty <= 7) {
        // Mid rounds: easy and medium words
        wordPool = WORD_BANK.filter(w => w.length <= 8);
    } else if (difficulty <= 12) {
        // Later rounds: easy, medium, and hard words
        wordPool = WORD_BANK.filter(w => w.length <= 12);
    } else {
        // Late rounds: all words
        wordPool = WORD_BANK;
    }
    
    // Filter out excluded words
    wordPool = wordPool.filter(word => !excludedWords.includes(word));
    
    // If no words available (all excluded), fall back to all words in difficulty
    if (wordPool.length === 0) {
        if (difficulty <= 3) {
            wordPool = WORD_BANK.filter(w => w.length <= 5);
        } else if (difficulty <= 7) {
            wordPool = WORD_BANK.filter(w => w.length <= 8);
        } else if (difficulty <= 12) {
            wordPool = WORD_BANK.filter(w => w.length <= 12);
        } else {
            wordPool = WORD_BANK;
        }
    }
    
    return wordPool[Math.floor(Math.random() * wordPool.length)];
}

export function getRandomBossWord() {
    return BOSS_WORDS[Math.floor(Math.random() * BOSS_WORDS.length)];
}

export function getBossWord(round, excludedWords = []) {
    // Determine difficulty based on which boss round this is
    const bossNumber = Math.floor(round / 5);
    let wordPool;
    
    if (bossNumber === 1) {
        // First boss (round 5) - easy words (3-5 letters)
        wordPool = WORD_BANK.filter(w => w.length >= 3 && w.length <= 5);
    } else if (bossNumber === 2) {
        // Second boss (round 10) - medium words (6-8 letters)
        wordPool = WORD_BANK.filter(w => w.length >= 6 && w.length <= 8);
    } else if (bossNumber === 3) {
        // Third boss (round 15) - hard words (9-12 letters)
        wordPool = WORD_BANK.filter(w => w.length >= 9 && w.length <= 12);
    } else if (bossNumber === 4) {
        // Fourth boss (round 20) - very hard words (13+ letters)
        wordPool = WORD_BANK.filter(w => w.length >= 13);
    } else {
        // Fifth boss and beyond (round 25+) - boss words
        wordPool = BOSS_WORDS;
    }
    
    // Filter out excluded words
    wordPool = wordPool.filter(word => !excludedWords.includes(word));
    
    // If no words available (all excluded), fall back to all words in difficulty
    if (wordPool.length === 0) {
        if (bossNumber === 1) {
            wordPool = WORD_BANK.filter(w => w.length >= 3 && w.length <= 5);
        } else if (bossNumber === 2) {
            wordPool = WORD_BANK.filter(w => w.length >= 6 && w.length <= 8);
        } else if (bossNumber === 3) {
            wordPool = WORD_BANK.filter(w => w.length >= 9 && w.length <= 12);
        } else if (bossNumber === 4) {
            wordPool = WORD_BANK.filter(w => w.length >= 13);
        } else {
            wordPool = BOSS_WORDS;
        }
    }
    
    return wordPool[Math.floor(Math.random() * wordPool.length)];
}
