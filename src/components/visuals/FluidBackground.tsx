"use client";

import { useEffect, useRef } from "react";

export default function FluidBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // --- CONFIG ---
    const config = {
      TEXTURE_DOWNSAMPLE: 1,
      DENSITY_DISSIPATION: 0.98, // Što bliže 1.0, duže traje boja
      VELOCITY_DISSIPATION: 0.99,
      PRESSURE: 0.8,
      PRESSURE_ITERATIONS: 20,
      CURL: 35,
      SPLAT_RADIUS: 0.008, // Veliki splat
      SPLAT_FORCE: 6000,
    };

    const gl = canvas.getContext("webgl2", { alpha: true, antialias: false });
    if (!gl) {
        console.error("FluidBackground: WebGL2 not supported!");
        return;
    }

    gl.getExtension("EXT_color_buffer_float");
    gl.getExtension("OES_texture_float_linear");

    // --- SHADERS ---
    const baseVertexShader = `#version 300 es
    in vec2 aPosition;
    out vec2 vUv;
    out vec2 vL; out vec2 vR; out vec2 vT; out vec2 vB;
    uniform vec2 texelSize;
    void main () {
        vUv = aPosition * 0.5 + 0.5;
        vL = vUv - vec2(texelSize.x, 0.0);
        vR = vUv + vec2(texelSize.x, 0.0);
        vT = vUv + vec2(0.0, texelSize.y);
        vB = vUv - vec2(0.0, texelSize.y);
        gl_Position = vec4(aPosition, 0.0, 1.0);
    }`;

    const displayShader = `#version 300 es
    precision highp float;
    in vec2 vUv;
    uniform sampler2D uTexture;
    out vec4 outColor;
    void main () {
        vec3 C = texture(uTexture, vUv).rgb;
        float a = max(C.r, max(C.g, C.b));
        // FORCE VISIBILITY: Ako ima imalo boje, prikazi je jako!
        outColor = vec4(C, a > 0.001 ? 1.0 : 0.0);
    }`;

    const splatShader = `#version 300 es
    precision highp float;
    in vec2 vUv;
    uniform sampler2D uTarget;
    uniform float aspectRatio;
    uniform vec3 color;
    uniform vec2 point;
    uniform float radius;
    out vec4 outColor;
    void main () {
        vec2 p = vUv - point.xy;
        p.x *= aspectRatio;
        vec3 splat = exp(-dot(p, p) / radius) * color;
        vec3 base = texture(uTarget, vUv).xyz;
        outColor = vec4(base + splat, 1.0);
    }`;

    const advectionShader = `#version 300 es
    precision highp float; in vec2 vUv; uniform sampler2D uVelocity; uniform sampler2D uSource; uniform vec2 texelSize; uniform float dt; uniform float dissipation; out vec4 outColor;
    void main () { vec2 coord = vUv - dt * texture(uVelocity, vUv).xy * texelSize; outColor = dissipation * texture(uSource, coord); outColor.a = 1.0; }`;
    const divergenceShader = `#version 300 es
    precision highp float; in vec2 vUv; in vec2 vL; in vec2 vR; in vec2 vT; in vec2 vB; uniform sampler2D uVelocity; out float outColor;
    void main () { float L = texture(uVelocity, vL).x; float R = texture(uVelocity, vR).x; float T = texture(uVelocity, vT).y; float B = texture(uVelocity, vB).y; vec2 C = texture(uVelocity, vUv).xy; if (vL.x < 0.0) { L = -C.x; } if (vR.x > 1.0) { R = -C.x; } if (vT.y > 1.0) { T = -C.y; } if (vB.y < 0.0) { B = -C.y; } float div = 0.5 * (R - L + T - B); outColor = div; }`;
    const curlShader = `#version 300 es
    precision highp float; in vec2 vUv; in vec2 vL; in vec2 vR; in vec2 vT; in vec2 vB; uniform sampler2D uVelocity; out float outColor;
    void main () { float L = texture(uVelocity, vL).y; float R = texture(uVelocity, vR).y; float T = texture(uVelocity, vT).x; float B = texture(uVelocity, vB).x; float vorticity = R - L - T + B; outColor = vorticity; }`;
    const vorticityShader = `#version 300 es
    precision highp float; in vec2 vUv; in vec2 vL; in vec2 vR; in vec2 vT; in vec2 vB; uniform sampler2D uVelocity; uniform sampler2D uCurl; uniform float curl; uniform float dt; out vec4 outColor;
    void main () { float L = texture(uCurl, vL).x; float R = texture(uCurl, vR).x; float T = texture(uCurl, vT).x; float B = texture(uCurl, vB).x; float C = texture(uCurl, vUv).x; vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L)); force /= length(force) + 0.0001; force *= curl * C; force.y *= -1.0; vec2 velocity = texture(uVelocity, vUv).xy; outColor = vec4(velocity + force * dt, 0.0, 1.0); }`;
    const pressureShader = `#version 300 es
    precision highp float; in vec2 vUv; in vec2 vL; in vec2 vR; in vec2 vT; in vec2 vB; uniform sampler2D uPressure; uniform sampler2D uDivergence; out float outColor;
    void main () { float L = texture(uPressure, vL).x; float R = texture(uPressure, vR).x; float T = texture(uPressure, vT).x; float B = texture(uPressure, vB).x; float C = texture(uPressure, vUv).x; float divergence = texture(uDivergence, vUv).x; float pressure = (L + R + B + T - divergence) * 0.25; outColor = pressure; }`;
    const gradientSubtractShader = `#version 300 es
    precision highp float; in vec2 vUv; in vec2 vL; in vec2 vR; in vec2 vT; in vec2 vB; uniform sampler2D uPressure; uniform sampler2D uVelocity; out vec4 outColor;
    void main () { float L = texture(uPressure, vL).x; float R = texture(uPressure, vR).x; float T = texture(uPressure, vT).x; float B = texture(uPressure, vB).x; vec2 velocity = texture(uVelocity, vUv).xy; velocity.xy -= vec2(R - L, T - B); outColor = vec4(velocity, 0.0, 1.0); }`;

    function createProgram(vs: string, fs: string) {
      const p = gl!.createProgram();
      const v = gl!.createShader(gl!.VERTEX_SHADER)!;
      const f = gl!.createShader(gl!.FRAGMENT_SHADER)!;
      gl!.shaderSource(v, vs); gl!.compileShader(v);
      gl!.shaderSource(f, fs); gl!.compileShader(f);
      gl!.attachShader(p!, v); gl!.attachShader(p!, f);
      gl!.linkProgram(p!);
      return p!;
    }

    const programs = {
      splat: createProgram(baseVertexShader, splatShader),
      advection: createProgram(baseVertexShader, advectionShader),
      divergence: createProgram(baseVertexShader, divergenceShader),
      curl: createProgram(baseVertexShader, curlShader),
      vorticity: createProgram(baseVertexShader, vorticityShader),
      pressure: createProgram(baseVertexShader, pressureShader),
      gradSubtract: createProgram(baseVertexShader, gradientSubtractShader),
      display: createProgram(baseVertexShader, displayShader),
    };

    function createFBO(w: number, h: number) {
      gl!.activeTexture(gl!.TEXTURE0);
      const tex = gl!.createTexture();
      gl!.bindTexture(gl!.TEXTURE_2D, tex);
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MIN_FILTER, gl!.LINEAR);
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MAG_FILTER, gl!.LINEAR);
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_S, gl!.CLAMP_TO_EDGE);
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_T, gl!.CLAMP_TO_EDGE);
      gl!.texImage2D(gl!.TEXTURE_2D, 0, gl!.RGBA16F, w, h, 0, gl!.RGBA, gl!.HALF_FLOAT, null);
      const fbo = gl!.createFramebuffer();
      gl!.bindFramebuffer(gl!.FRAMEBUFFER, fbo);
      gl!.framebufferTexture2D(gl!.FRAMEBUFFER, gl!.COLOR_ATTACHMENT0, gl!.TEXTURE_2D, tex, 0);
      return { fbo, tex, w, h, attach: (id: number) => { gl!.activeTexture(gl!.TEXTURE0 + id); gl!.bindTexture(gl!.TEXTURE_2D, tex); } };
    }

    function createDoubleFBO(w: number, h: number) {
      let fbo1 = createFBO(w, h);
      let fbo2 = createFBO(w, h);
      return { w, h, read: fbo1, write: fbo2, swap: () => { let tmp = fbo1; fbo1 = fbo2; fbo2 = tmp; }, texelSize: [1.0 / w, 1.0 / h] };
    }

    let w = canvas.width = canvas.clientWidth;
    let h = canvas.height = canvas.clientHeight;
    
    let density = createDoubleFBO(w, h);
    let velocity = createDoubleFBO(w, h);
    let divergence = createFBO(w, h);
    let curl = createFBO(w, h);
    let pressure = createDoubleFBO(w, h);

    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(0);

    function blit(dst: any) {
        gl!.bindFramebuffer(gl!.FRAMEBUFFER, dst ? dst.fbo : null);
        gl!.drawElements(gl!.TRIANGLES, 6, gl!.UNSIGNED_SHORT, 0);
    }

    function splat(x: number, y: number, dx: number, dy: number, color: number[]) {
        gl!.viewport(0, 0, velocity.w, velocity.h);
        gl!.useProgram(programs.splat);
        gl!.uniform1i(gl!.getUniformLocation(programs.splat, "uTarget"), 0);
        gl!.uniform1f(gl!.getUniformLocation(programs.splat, "aspectRatio"), w / h);
        gl!.uniform2f(gl!.getUniformLocation(programs.splat, "point"), x, y);
        gl!.uniform3f(gl!.getUniformLocation(programs.splat, "color"), dx, dy, 0.0);
        gl!.uniform1f(gl!.getUniformLocation(programs.splat, "radius"), config.SPLAT_RADIUS);
        velocity.read.attach(0);
        blit(velocity.write);
        velocity.swap();

        gl!.viewport(0, 0, density.w, density.h);
        gl!.uniform1i(gl!.getUniformLocation(programs.splat, "uTarget"), 0);
        gl!.uniform3f(gl!.getUniformLocation(programs.splat, "color"), color[0], color[1], color[2]);
        density.read.attach(0);
        blit(density.write);
        density.swap();
    }

    let lastTime = Date.now();
    function update() {
        const dt = Math.min((Date.now() - lastTime) / 1000, 0.016);
        lastTime = Date.now();

        gl!.viewport(0, 0, velocity.w, velocity.h);
        gl!.useProgram(programs.curl);
        gl!.uniform2f(gl!.getUniformLocation(programs.curl, "texelSize"), velocity.texelSize[0], velocity.texelSize[1]);
        gl!.uniform1i(gl!.getUniformLocation(programs.curl, "uVelocity"), 0);
        velocity.read.attach(0);
        blit(curl);

        gl!.useProgram(programs.vorticity);
        gl!.uniform2f(gl!.getUniformLocation(programs.vorticity, "texelSize"), velocity.texelSize[0], velocity.texelSize[1]);
        gl!.uniform1i(gl!.getUniformLocation(programs.vorticity, "uVelocity"), 0);
        gl!.uniform1i(gl!.getUniformLocation(programs.vorticity, "uCurl"), 1);
        gl!.uniform1f(gl!.getUniformLocation(programs.vorticity, "curl"), config.CURL);
        gl!.uniform1f(gl!.getUniformLocation(programs.vorticity, "dt"), dt);
        velocity.read.attach(0);
        curl.attach(1);
        blit(velocity.write);
        velocity.swap();

        gl!.useProgram(programs.divergence);
        gl!.uniform2f(gl!.getUniformLocation(programs.divergence, "texelSize"), velocity.texelSize[0], velocity.texelSize[1]);
        gl!.uniform1i(gl!.getUniformLocation(programs.divergence, "uVelocity"), 0);
        velocity.read.attach(0);
        blit(divergence);

        gl!.useProgram(programs.pressure);
        gl!.uniform2f(gl!.getUniformLocation(programs.pressure, "texelSize"), velocity.texelSize[0], velocity.texelSize[1]);
        gl!.uniform1i(gl!.getUniformLocation(programs.pressure, "uPressure"), 0);
        gl!.uniform1i(gl!.getUniformLocation(programs.pressure, "uDivergence"), 1);
        pressure.read.attach(0);
        divergence.attach(1);
        for(let i=0; i<config.PRESSURE_ITERATIONS; i++) {
            pressure.read.attach(0);
            blit(pressure.write);
            pressure.swap();
        }

        gl!.useProgram(programs.gradSubtract);
        gl!.uniform2f(gl!.getUniformLocation(programs.gradSubtract, "texelSize"), velocity.texelSize[0], velocity.texelSize[1]);
        gl!.uniform1i(gl!.getUniformLocation(programs.gradSubtract, "uPressure"), 0);
        gl!.uniform1i(gl!.getUniformLocation(programs.gradSubtract, "uVelocity"), 1);
        pressure.read.attach(0);
        velocity.read.attach(1);
        blit(velocity.write);
        velocity.swap();

        gl!.useProgram(programs.advection);
        gl!.uniform2f(gl!.getUniformLocation(programs.advection, "texelSize"), velocity.texelSize[0], velocity.texelSize[1]);
        gl!.uniform1i(gl!.getUniformLocation(programs.advection, "uVelocity"), 0);
        gl!.uniform1i(gl!.getUniformLocation(programs.advection, "uSource"), 0);
        gl!.uniform1f(gl!.getUniformLocation(programs.advection, "dt"), dt);
        gl!.uniform1f(gl!.getUniformLocation(programs.advection, "dissipation"), config.VELOCITY_DISSIPATION);
        velocity.read.attach(0);
        blit(velocity.write);
        velocity.swap();

        gl!.viewport(0, 0, density.w, density.h);
        gl!.useProgram(programs.advection);
        gl!.uniform2f(gl!.getUniformLocation(programs.advection, "texelSize"), density.texelSize[0], density.texelSize[1]);
        gl!.uniform1i(gl!.getUniformLocation(programs.advection, "uVelocity"), 0);
        gl!.uniform1i(gl!.getUniformLocation(programs.advection, "uSource"), 1);
        gl!.uniform1f(gl!.getUniformLocation(programs.advection, "dt"), dt);
        gl!.uniform1f(gl!.getUniformLocation(programs.advection, "dissipation"), config.DENSITY_DISSIPATION);
        velocity.read.attach(0);
        density.read.attach(1);
        blit(density.write);
        density.swap();

        gl!.viewport(0, 0, gl!.drawingBufferWidth, gl!.drawingBufferHeight);
        gl!.useProgram(programs.display);
        gl!.uniform1i(gl!.getUniformLocation(programs.display, "uTexture"), 0);
        density.read.attach(0);
        blit(null);

        requestAnimationFrame(update);
    }

    // --- JAKO TAMNE BOJE ZA BELU POZADINU ---
    const colors = [
       [0.0, 0.0, 0.8], // Deep Blue
       [0.4, 0.0, 0.8], // Deep Purple
       [0.0, 0.5, 0.5]  // Deep Teal
    ];

    // Inicijalni "Splash" - agresivan
    for(let i=0; i<15; i++) {
       splat(Math.random(), Math.random(), 0, 0, colors[i%3]);
    }

    // Auto-Splat (Heartbeat) svakih 500ms
    const interval = setInterval(() => {
        const x = Math.random();
        const y = Math.random();
        const color = colors[Math.floor(Math.random() * colors.length)];
        // Ogroman splat
        splat(x, y, (Math.random()-0.5)*5000, (Math.random()-0.5)*5000, color);
    }, 500);

    const onMove = (e: MouseEvent) => {
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = 1.0 - (e.clientY - rect.top) / rect.height;
        const color = colors[Math.floor(Math.random() * colors.length)];
        splat(x, y, e.movementX * 20, -e.movementY * 20, color);
    };

    const onResize = () => {
      w = canvas.width = canvas.clientWidth;
      h = canvas.height = canvas.clientHeight;
      density = createDoubleFBO(w, h);
      velocity = createDoubleFBO(w, h);
      divergence = createFBO(w, h);
      curl = createFBO(w, h);
      pressure = createDoubleFBO(w, h);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('resize', onResize);
    update();

    return () => {
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('resize', onResize);
        clearInterval(interval);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="block w-full h-full"
      // DEBUG BORDER: Ako vidiš crveno, canvas je tu!
      // style={{ border: '5px solid red' }} 
    />
  );
}