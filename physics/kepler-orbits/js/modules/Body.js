export class Body {
    constructor(name, color, size, a, e, period, parent = null) {
        this.name = name;
        this.color = color;
        this.size = size;
        this.a = a; // Semi-major axis (pixels)
        this.e = e; // Eccentricity
        this.period = period; // Orbital period (years)
        this.parent = parent;

        this.M = Math.random() * Math.PI * 2; // Mean Anomaly
        this.E = 0; // Eccentric Anomaly
        this.x = 0;
        this.y = 0;

        this.trail = [];
        this.maxTrailLength = 200;
    }

    /*
     * Solves Kepler's Equation M = E - e*sin(E) for E using Newton-Raphson
     */
    solveKepler(M, e) {
        let E = M; // Initial guess
        for (let i = 0; i < 10; i++) {
            const f = E - e * Math.sin(E) - M;
            const df = 1 - e * Math.cos(E);
            const delta = f / df;
            E -= delta;
            if (Math.abs(delta) < 1e-6) break;
        }
        return E;
    }

    update(dt) {
        if (this.parent) {
            // Mean motion n = 2*pi / P
            const n = (2 * Math.PI) / this.period;

            // Update Mean Anomaly
            this.M += n * dt;
            // Keep M in [0, 2pi]
            this.M %= (2 * Math.PI);

            // Solve Kepler's Equation for E
            this.E = this.solveKepler(this.M, this.e);

            // Calculate True Anomaly, nu
            // tan(nu/2) = sqrt((1+e)/(1-e)) * tan(E/2)
            const sqrtTerm = Math.sqrt((1 + this.e) / (1 - this.e));
            const tanNu2 = sqrtTerm * Math.tan(this.E / 2);
            const nu = 2 * Math.atan(tanNu2);

            // Calculate distance r from focus
            // r = a * (1 - e*cos(E))
            const r = this.a * (1 - this.e * Math.cos(this.E));

            // Position in orbital plane (focus at origin)
            const relX = r * Math.cos(nu);
            const relY = r * Math.sin(nu);

            // Update position relative to parent
            this.x = this.parent.x + relX;
            this.y = this.parent.y + relY;

        } else {
            // Static or center (Sun)
            this.x = 0;
            this.y = 0;
        }

        // Update trail
        if (this.trail.length === 0 ||
            Math.hypot(this.x - this.trail[this.trail.length - 1].x, this.y - this.trail[this.trail.length - 1].y) > 2) {
            this.trail.push({ x: this.x, y: this.y });
            if (this.trail.length > this.maxTrailLength) {
                this.trail.shift();
            }
        }
    }

    drawOrbit(ctx, drawFoci = false, scale = 1.0, userEcc = null) {
        if (!this.parent) return;

        const drawnEcc = userEcc !== null ? userEcc : this.e;

        ctx.beginPath();
        // Orbits are subtle white unless focused
        ctx.strokeStyle = drawFoci ? this.color : "rgba(255, 255, 255, 0.15)";
        ctx.lineWidth = (drawFoci ? 2 : 1) / scale;

        // Draw the full ellipse
        const samples = 100;
        for (let i = 0; i <= samples; i++) {
            const E = (i / samples) * 2 * Math.PI;

            const r = this.a * (1 - drawnEcc * Math.cos(E));

            const sqrtTerm = Math.sqrt((1 + drawnEcc) / (1 - drawnEcc));
            const tanNu2 = sqrtTerm * Math.tan(E / 2);
            const nu = 2 * Math.atan(tanNu2);

            const x = r * Math.cos(nu);
            const y = r * Math.sin(nu);

            if (i === 0) ctx.moveTo(this.parent.x + x, this.parent.y + y);
            else ctx.lineTo(this.parent.x + x, this.parent.y + y);
        }
        ctx.stroke();

        if (drawFoci) {
            // Draw Foci in Red
            this.drawX(ctx, this.parent.x, this.parent.y, "#ffb5b5ff", scale);

            const f2x = this.parent.x - 2 * this.a * drawnEcc;
            const f2y = this.parent.y;

            this.drawX(ctx, f2x, f2y, "#ffb5b5ff", scale);
        }
    }

    drawX(ctx, x, y, color, scale = 1.0) {
        const size = 6 / scale;
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2 / scale;
        ctx.moveTo(x - size, y - size);
        ctx.lineTo(x + size, y + size);
        ctx.moveTo(x + size, y - size);
        ctx.lineTo(x - size, y + size);
        ctx.stroke();
    }

    drawAxes(ctx, scale = 1.0, userEcc = null) {
        if (!this.parent) return;

        const drawnEcc = userEcc !== null ? userEcc : this.e;

        // Calculate semi-minor axis b
        const b = this.a * Math.sqrt(1 - drawnEcc * drawnEcc);

        const cx = this.parent.x - this.a * drawnEcc;
        const cy = this.parent.y;

        ctx.save();
        ctx.beginPath();
        // Estilo gris y punteado para los ejes
        ctx.strokeStyle = "rgba(150, 150, 150, 1)";
        ctx.lineWidth = 1 / scale;
        // Dividimos el patrón de punteado por la escala para que se vea igual en pantalla siempre
        ctx.setLineDash([5 / scale, 5 / scale]);

        // Eje Mayor
        ctx.moveTo(cx - this.a, cy);
        ctx.lineTo(cx + this.a, cy);

        // Eje Menor
        ctx.moveTo(cx, cy - b);
        ctx.lineTo(cx, cy + b);

        ctx.stroke();
        ctx.restore(); // El restore limpia el setLineDash automáticamente
    }

    draw(ctx, showTrail, showLabel, sizeMultiplier = 1.0, scale = 1.0) {
        // Draw Trail
        if (showTrail && this.trail.length > 1) {
            ctx.beginPath();
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 3 / scale;
            ctx.globalAlpha = 0.5;

            ctx.moveTo(this.trail[0].x, this.trail[0].y);
            for (let i = 1; i < this.trail.length; i++) {
                ctx.lineTo(this.trail[i].x, this.trail[i].y);
            }
            ctx.stroke();
            ctx.globalAlpha = 1.0;
        }

        // Draw Body
        ctx.beginPath();
        // Base screen size is 'size * sizeMultiplier'. 
        // We ensure a minimum radius to keep it visible at extreme zooms.
        const baseSize = this.size * sizeMultiplier;
        const drawSize = Math.max(2 / scale, baseSize / scale);

        ctx.arc(this.x, this.y, drawSize, 0, Math.PI * 2);
        ctx.fillStyle = this.color;

        // Glow
        // Sun has a much larger glow. Others get glow proportional to their on-screen size.
        const shadowAmt = (this.name === 'Sol' ? 40 * sizeMultiplier : 15 * sizeMultiplier) / scale;
        ctx.shadowBlur = shadowAmt;
        ctx.shadowColor = this.color;

        ctx.fill();
        ctx.shadowBlur = 0;

        // Draw Label
        if (showLabel) {
            ctx.fillStyle = "rgba(255, 255, 255, 0.95)";

            // --- CONFIGURACIÓN DE TAMAÑOS ---
            // Cambia estos valores para ajustar el tamaño de la fuente en pantalla (píxeles)
            const baseFontSize = 24;      // Tamaño normal
            const highlightFontSize = 24; // Tamaño al estar seleccionado o ser el Sol
            // --------------------------------

            const targetSize = (sizeMultiplier > 1.1) ? highlightFontSize : baseFontSize;
            const fontSize = targetSize / scale;

            const isHighlighted = (this.name === 'Sol' || sizeMultiplier > 1.1);
            ctx.font = `${isHighlighted ? '600' : '400'} ${fontSize}px Inter, sans-serif`;

            // Separación del texto: radio actual + 10 píxeles de pantalla
            const textPadding = 10 / scale;
            const offset = drawSize + textPadding;

            // Dibujar texto
            ctx.fillText(this.name, this.x + offset, this.y + (fontSize * 0.35));
        }
    }
}
