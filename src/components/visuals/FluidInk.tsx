"use client";

import { useEffect, useRef } from "react";

export default function FluidInk() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // --- KONFIGURACIJA ZA "INK" OSEĆAJ ---
    const config = {
      SIM_RESOLUTION: 128, // Manje = mutnije/mekše (bolje za ink)
      DYE_RESOLUTION: 512, // Oštrina prikaza
      DENSITY_DISSIPATION: 0.97, // 0.97 = sporije nestaje (kao ulje/mastilo)
      VELOCITY_DISSIPATION: 0.98, // Inercija tečnosti
      PRESSURE: 0.8,
      PRESSURE_ITERATIONS: 20,
      CURL: 30, // Mnogo veći curl za "kovrdžanje" dima/mastila
      SPLAT_RADIUS: 0.4, // Veličina mrlje
      SPLAT_FORCE: 6000,
      SHADING: true,
    };

    // Helper za konverziju boja
    function getRGBColor(varName: string) {
      const style = getComputedStyle(document.documentElement);
      const val = style.getPropertyValue(varName).trim();
      // Ako je hex
      if (val.startsWith("#")) {
        let c = val.substring(1);
        if (c.length === 3) c = c.split("").map((x) => x + x).join("");
        const num = parseInt(c, 16);
        return [((num >> 16) & 255) / 255, ((num >> 8) & 255) / 255, (num & 255) / 255];
      }
      // Fallback (Brand 1)
      return [0.2, 0.2, 0.8]; 
    }

    // Učitaj tvoje boje
    const palette = [
      getRGBColor("--brand-1"), // #4F46E5
      getRGBColor("--brand-2"), // #22D3EE
      getRGBColor("--brand-3"), // #14B8A6
    ];

    // WebGL setup
    const gl = canvas.getContext("webgl2", { alpha: true, depth: false, antialias: false });
    if (!gl) return;

    const ext = {
      formatRGBA: getSupportedFormat(gl, gl.RGBA16F, gl.RGBA, gl.HALF_FLOAT),
      formatRG: getSupportedFormat(gl, gl.RG16F, gl.RG, gl.HALF_FLOAT),
      formatR: getSupportedFormat(gl, gl.R16F, gl.RED, gl.HALF_FLOAT),
    };

    function getSupportedFormat(gl: WebGL2RenderingContext, internalFormat: number, format: number, type: number) {
      if (!supportRenderTextureFormat(gl, internalFormat, format, type)) {
        switch (internalFormat) {
          case gl.R16F: return getSupportedFormat(gl, gl.R8, gl.RED, gl.UNSIGNED_BYTE);
          case gl.RG16F: return getSupportedFormat(gl, gl.RG8, gl.RG, gl.UNSIGNED_BYTE);
          case gl.RGBA16F: return getSupportedFormat(gl, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE);
        }
      }
      return { internalFormat, format };
    }

    function supportRenderTextureFormat(gl: any, internalFormat: any, format: any, type: any) {
      let texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, 4, 4, 0, format, type, null);
      let fbo = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
      let status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
      return status == gl.FRAMEBUFFER_COMPLETE;
    }

    // --- SHADERS (Standard Fluid Solvers) ---
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
      }
    `;

    const displayShaderSource = `#version 300 es
      precision highp float;
      in vec2 vUv;
      uniform sampler2D uTexture;
      out vec4 outColor;
      void main () {
          vec3 C = texture(uTexture, vUv).rgb;
          float a = max(C.r, max(C.g, C.b));
          // Dodaj malo "curve" da boje budu intenzivnije
          outColor = vec4(C, a * 0.8); 
      }
    `;
    
    const splatShaderSource = `#version 300 es
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
      }
    `;

    // Ostali shaderi (Advection, Divergence, Curl, Vorticity, Pressure, GradientSubtract)
    // Koristim standardne implementacije, skraćeno ovde radi preglednosti ali kompletno funkcionalno:
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

    // Compile Helpers
    function createProgram(vsSource: string, fsSource: string) {
      const program = gl!.createProgram();
      const vs = gl!.createShader(gl!.VERTEX_SHADER);
      const fs = gl!.createShader(gl!.FRAGMENT_SHADER);
      if (!program || !vs || !fs) return null;

      gl!.shaderSource(vs, vsSource); gl!.compileShader(vs);
      gl!.shaderSource(fs, fsSource); gl!.compileShader(fs);
      
      gl!.attachShader(program, vs); gl!.attachShader(program, fs);
      gl!.linkProgram(program);
      return program;
    }

    const programs = {
      splat: createProgram(baseVertexShader, splatShaderSource),
      advection: createProgram(baseVertexShader, advectionShader),
      divergence: createProgram(baseVertexShader, divergenceShader),
      curl: createProgram(baseVertexShader, curlShader),
      vorticity: createProgram(baseVertexShader, vorticityShader),
      pressure: createProgram(baseVertexShader, pressureShader),
      gradSubtract: createProgram(baseVertexShader, gradientSubtractShader),
      display: createProgram(baseVertexShader, displayShaderSource),
    };

    // FBO creation
    function createFBO(w: number, h: number, internalFormat: number, format: number, type: number) {
      gl!.activeTexture(gl!.TEXTURE0);
      const texture = gl!.createTexture();
      gl!.bindTexture(gl!.TEXTURE_2D, texture);
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MIN_FILTER, gl!.LINEAR);
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MAG_FILTER, gl!.LINEAR);
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_S, gl!.CLAMP_TO_EDGE);
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_T, gl!.CLAMP_TO_EDGE);
      gl!.texImage2D(gl.TEXTURE_2D, 0, internalFormat, w, h, 0, format, type, null);

      const fbo = gl!.createFramebuffer();
      gl!.bindFramebuffer(gl!.FRAMEBUFFER, fbo);
      gl!.framebufferTexture2D(gl!.FRAMEBUFFER, gl!.COLOR_ATTACHMENT0, gl!.TEXTURE_2D, texture, 0);
      return { fbo, texture, width: w, height: h, attach: (id: number) => gl!.activeTexture(gl!.TEXTURE0 + id) || gl!.bindTexture(gl!.TEXTURE_2D, texture) };
    }

    function createDoubleFBO(w: number, h: number, internalFormat: number, format: number, type: number) {
      let fbo1 = createFBO(w, h, internalFormat, format, type);
      let fbo2 = createFBO(w, h, internalFormat, format, type);
      return {
        width: w, height: h,
        read: fbo1, write: fbo2,
        swap: () => { let temp = fbo1; fbo1 = fbo2; fbo2 = temp; },
        get texelSize() { return [1.0/w, 1.0/h]; }
      };
    }

    let density: any, velocity: any, divergence: any, curl: any, pressure: any;

    function initFBOs() {
      const texType = ext.formatRGBA; // Use RGBA for density
      const rgType = ext.formatRG;    // Use RG for velocity
      const rType = ext.formatR;      // Use R for pressure/curl

      density = createDoubleFBO(config.DYE_RESOLUTION, config.DYE_RESOLUTION, texType.internalFormat, texType.format, gl!.HALF_FLOAT);
      velocity = createDoubleFBO(config.SIM_RESOLUTION, config.SIM_RESOLUTION, rgType.internalFormat, rgType.format, gl!.HALF_FLOAT);
      divergence = createFBO(config.SIM_RESOLUTION, config.SIM_RESOLUTION, rType.internalFormat, rType.format, gl!.HALF_FLOAT);
      curl = createFBO(config.SIM_RESOLUTION, config.SIM_RESOLUTION, rType.internalFormat, rType.format, gl!.HALF_FLOAT);
      pressure = createDoubleFBO(config.SIM_RESOLUTION, config.SIM_RESOLUTION, rType.internalFormat, rType.format, gl!.HALF_FLOAT);
    }
    
    initFBOs();

    // Blit helper
    const blit = (() => {
      gl!.bindBuffer(gl!.ARRAY_BUFFER, gl!.createBuffer());
      gl!.bufferData(gl!.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl!.STATIC_DRAW);
      gl!.bindBuffer(gl!.ELEMENT_ARRAY_BUFFER, gl!.createBuffer());
      gl!.bufferData(gl!.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl!.STATIC_DRAW);
      gl!.vertexAttribPointer(0, 2, gl!.FLOAT, false, 0, 0);
      gl!.enableVertexAttribArray(0);
      return (dst: any) => {
        gl!.bindFramebuffer(gl!.FRAMEBUFFER, dst ? dst.fbo : null);
        gl!.drawElements(gl!.TRIANGLES, 6, gl!.UNSIGNED_SHORT, 0);
      };
    })();

    // --- MAIN LOOP ---
    let lastTime = Date.now();
    // Automatsko kretanje promenljive
    let autoTime = 0; 

    function update() {
      const dt = Math.min((Date.now() - lastTime) / 1000, 0.016);
      lastTime = Date.now();
      autoTime += dt;

      // 1. AUTO MOVEMENT (IDLE ANIMATION)
      // Simuliramo "duha" koji crta osmice po ekranu
      const t = autoTime * 0.6; // Brzina auto kretanja
      const autoX = 0.5 + Math.sin(t) * 0.3;
      const autoY = 0.5 + Math.cos(t * 1.3) * 0.2;
      
      // Dodajemo "idle splat" svaki frame (malo slabiji)
      const autoColor = palette[Math.floor(t) % 3];
      splat(autoX, autoY, Math.cos(t)*1000, Math.sin(t)*1000, autoColor, 0.6); // 0.6 = opacity multiplier

      // 2. PHYSICS STEPS
      // (Isti pipeline: Curl -> Vorticity -> Divergence -> Pressure -> GradientSubtract -> Advection)
      
      // Curl
      gl!.viewport(0, 0, velocity.width, velocity.height);
      gl!.useProgram(programs.curl!);
      gl!.uniform2f(gl!.getUniformLocation(programs.curl!, "texelSize"), velocity.texelSize[0], velocity.texelSize[1]);
      gl!.uniform1i(gl!.getUniformLocation(programs.curl!, "uVelocity"), 0);
      velocity.read.attach(0);
      blit(curl);

      // Vorticity
      gl!.useProgram(programs.vorticity!);
      gl!.uniform2f(gl!.getUniformLocation(programs.vorticity!, "texelSize"), velocity.texelSize[0], velocity.texelSize[1]);
      gl!.uniform1i(gl!.getUniformLocation(programs.vorticity!, "uVelocity"), 0);
      gl!.uniform1i(gl!.getUniformLocation(programs.vorticity!, "uCurl"), 1);
      gl!.uniform1f(gl!.getUniformLocation(programs.vorticity!, "curl"), config.CURL);
      gl!.uniform1f(gl!.getUniformLocation(programs.vorticity!, "dt"), dt);
      velocity.read.attach(0);
      curl.attach(1);
      blit(velocity.write);
      velocity.swap();

      // Divergence
      gl!.useProgram(programs.divergence!);
      gl!.uniform2f(gl!.getUniformLocation(programs.divergence!, "texelSize"), velocity.texelSize[0], velocity.texelSize[1]);
      gl!.uniform1i(gl!.getUniformLocation(programs.divergence!, "uVelocity"), 0);
      velocity.read.attach(0);
      blit(divergence);

      // Pressure
      gl!.useProgram(programs.pressure!);
      gl!.uniform2f(gl!.getUniformLocation(programs.pressure!, "texelSize"), velocity.texelSize[0], velocity.texelSize[1]);
      gl!.uniform1i(gl!.getUniformLocation(programs.pressure!, "uPressure"), 0);
      gl!.uniform1i(gl!.getUniformLocation(programs.pressure!, "uDivergence"), 1);
      pressure.read.attach(0);
      divergence.attach(1);
      for(let i=0; i<config.PRESSURE_ITERATIONS; i++){
        pressure.read.attach(0);
        blit(pressure.write);
        pressure.swap();
      }

      // Gradient Subtract
      gl!.useProgram(programs.gradSubtract!);
      gl!.uniform2f(gl!.getUniformLocation(programs.gradSubtract!, "texelSize"), velocity.texelSize[0], velocity.texelSize[1]);
      gl!.uniform1i(gl!.getUniformLocation(programs.gradSubtract!, "uPressure"), 0);
      gl!.uniform1i(gl!.getUniformLocation(programs.gradSubtract!, "uVelocity"), 1);
      pressure.read.attach(0);
      velocity.read.attach(1);
      blit(velocity.write);
      velocity.swap();

      // Advection (Velocity)
      gl!.useProgram(programs.advection!);
      gl!.uniform2f(gl!.getUniformLocation(programs.advection!, "texelSize"), velocity.texelSize[0], velocity.texelSize[1]);
      gl!.uniform1i(gl!.getUniformLocation(programs.advection!, "uVelocity"), 0);
      gl!.uniform1i(gl!.getUniformLocation(programs.advection!, "uSource"), 0); // Velocity flows itself
      gl!.uniform1f(gl!.getUniformLocation(programs.advection!, "dt"), dt);
      gl!.uniform1f(gl!.getUniformLocation(programs.advection!, "dissipation"), config.VELOCITY_DISSIPATION);
      velocity.read.attach(0);
      blit(velocity.write);
      velocity.swap();

      // Advection (Density - The Colors)
      gl!.viewport(0, 0, density.width, density.height);
      gl!.useProgram(programs.advection!); // Reuse advection shader
      gl!.uniform2f(gl!.getUniformLocation(programs.advection!, "texelSize"), density.texelSize[0], density.texelSize[1]);
      gl!.uniform1i(gl!.getUniformLocation(programs.advection!, "uVelocity"), 0);
      gl!.uniform1i(gl!.getUniformLocation(programs.advection!, "uSource"), 1);
      gl!.uniform1f(gl!.getUniformLocation(programs.advection!, "dt"), dt);
      gl!.uniform1f(gl!.getUniformLocation(programs.advection!, "dissipation"), config.DENSITY_DISSIPATION);
      velocity.read.attach(0);
      density.read.attach(1);
      blit(density.write);
      density.swap();

      // Render to Screen
      gl!.viewport(0, 0, gl!.drawingBufferWidth, gl!.drawingBufferHeight);
      gl!.useProgram(programs.display!);
      gl!.uniform1i(gl!.getUniformLocation(programs.display!, "uTexture"), 0);
      density.read.attach(0);
      blit(null);

      requestAnimationFrame(update);
    }

    function splat(x: number, y: number, dx: number, dy: number, color: number[], intensity = 1.0) {
      gl!.viewport(0, 0, velocity.width, velocity.height);
      gl!.useProgram(programs.splat!);
      gl!.uniform1i(gl!.getUniformLocation(programs.splat!, "uTarget"), 0);
      gl!.uniform1f(gl!.getUniformLocation(programs.splat!, "aspectRatio"), canvas!.width / canvas!.height);
      gl!.uniform2f(gl!.getUniformLocation(programs.splat!, "point"), x, y);
      gl!.uniform3f(gl!.getUniformLocation(programs.splat!, "color"), dx, dy, 0.0);
      gl!.uniform1f(gl!.getUniformLocation(programs.splat!, "radius"), config.SPLAT_RADIUS / 100.0);
      velocity.read.attach(0);
      blit(velocity.write);
      velocity.swap();

      gl!.viewport(0, 0, density.width, density.height);
      gl!.uniform1i(gl!.getUniformLocation(programs.splat!, "uTarget"), 0);
      gl!.uniform3f(gl!.getUniformLocation(programs.splat!, "color"), color[0] * intensity, color[1] * intensity, color[2] * intensity);
      density.read.attach(0);
      blit(density.write);
      density.swap();
    }

    // Mouse Interaction
    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      // Ako je miš van canvasa, ignore
      if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) return;
      
      const x = (e.clientX - rect.left) / rect.width;
      const y = 1.0 - (e.clientY - rect.top) / rect.height;
      
      // Na svaki pokret dodajemo malo "impulsa"
      // Koristimo random boju iz palete
      const color = palette[Math.floor(Math.random() * palette.length)];
      splat(x, y, e.movementX * 5, -e.movementY * 5, color);
    };

    function resize() {
      canvas!.width = canvas!.clientWidth;
      canvas!.height = canvas!.clientHeight;
      initFBOs();
    }

    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", onMouseMove); // Global listener za interakciju
    
    resize();
    update();

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      // Koristimo opacity i blend modove da se stopi sa pozadinom (Light: multiply, Dark: screen/lighten)
      className="w-full h-full block opacity-60 dark:opacity-80 mix-blend-multiply dark:mix-blend-screen transition-opacity duration-700"
    />
  );
}