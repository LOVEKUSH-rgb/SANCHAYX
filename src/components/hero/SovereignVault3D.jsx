import React, { useEffect, useRef } from 'react';

export const SovereignVault3D = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let animationFrameId;
    let isCleanedUp = false;

    const initScene = () => {
      const THREE = window.THREE;
      if (!THREE || isCleanedUp) return;

      const width = container.clientWidth || 520;
      const height = container.clientHeight || 560;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);

      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      container.appendChild(renderer.domElement);

      // Calibrated Studio Lighting for Light Background (Soft Daylight White, Forest & Muted Gold)
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
      scene.add(ambientLight);

      const keyLight = new THREE.DirectionalLight(0xfffef5, 0.85);
      keyLight.position.set(5, 7, 6);
      scene.add(keyLight);

      const fillLight = new THREE.DirectionalLight(0xf1f5f3, 0.45);
      fillLight.position.set(-6, -4, 5);
      scene.add(fillLight);

      const goldRimLight = new THREE.PointLight(0xd97706, 0.40, 18);
      goldRimLight.position.set(0, 1.5, 4.5);
      scene.add(goldRimLight);

      // Master 3D Group
      const vaultGroup = new THREE.Group();
      scene.add(vaultGroup);

      // 1. Central Sovereign Forest & Gold Medallion
      const coinGeo = new THREE.CylinderGeometry(2.35, 2.35, 0.32, 64);
      const coinMat = new THREE.MeshPhongMaterial({
        color: 0x14523d,
        specular: 0x476355,
        shininess: 25
      });
      const coin = new THREE.Mesh(coinGeo, coinMat);
      coin.rotation.x = Math.PI / 2;
      vaultGroup.add(coin);

      // Gold Sovereign Beveled Rim
      const rimGeo = new THREE.TorusGeometry(2.36, 0.09, 16, 80);
      const rimMat = new THREE.MeshPhongMaterial({
        color: 0xc59b27,
        specular: 0x8a6d2b,
        shininess: 32
      });
      const rim = new THREE.Mesh(rimGeo, rimMat);
      vaultGroup.add(rim);

      // Inner Radiant Forest/Sage Ring
      const innerRingGeo = new THREE.TorusGeometry(1.80, 0.08, 16, 80);
      const innerRingMat = new THREE.MeshPhongMaterial({
        color: 0x1b5e46,
        specular: 0x4a6e5d,
        shininess: 25
      });
      const innerRing = new THREE.Mesh(innerRingGeo, innerRingMat);
      vaultGroup.add(innerRing);

      // 2. Central Sovereign Core Emblem
      const coreGeo = new THREE.CylinderGeometry(1.10, 1.10, 0.40, 8);
      const coreMat = new THREE.MeshPhongMaterial({
        color: 0x0f3d2e,
        specular: 0x3d594c,
        shininess: 25
      });
      const coreSeal = new THREE.Mesh(coreGeo, coreMat);
      coreSeal.rotation.x = Math.PI / 2;
      vaultGroup.add(coreSeal);

      // Rupee / Shield Jewel in Center
      const jewelGeo = new THREE.OctahedronGeometry(0.55, 0);
      const jewelMat = new THREE.MeshPhongMaterial({
        color: 0xc89b3c,
        specular: 0xfef3c7,
        shininess: 50
      });
      const jewel = new THREE.Mesh(jewelGeo, jewelMat);
      jewel.position.z = 0.25;
      vaultGroup.add(jewel);

      // 3. Dynamic Gimbal Security Rings
      const ring1Geo = new THREE.TorusGeometry(3.05, 0.045, 16, 90);
      const ring1Mat = new THREE.MeshPhongMaterial({
        color: 0x6e9483,
        specular: 0x8faea0,
        shininess: 20,
        transparent: true,
        opacity: 0.40
      });
      const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
      vaultGroup.add(ring1);

      const ring2Geo = new THREE.TorusGeometry(3.85, 0.040, 16, 90);
      const ring2Mat = new THREE.MeshPhongMaterial({
        color: 0xb49a5b,
        specular: 0xc8b27c,
        shininess: 25,
        transparent: true,
        opacity: 0.32
      });
      const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
      vaultGroup.add(ring2);

      const ring3Geo = new THREE.TorusGeometry(4.65, 0.035, 16, 100);
      const ring3Mat = new THREE.MeshPhongMaterial({
        color: 0x849e92,
        specular: 0xa4b9af,
        shininess: 18,
        transparent: true,
        opacity: 0.25
      });
      const ring3 = new THREE.Mesh(ring3Geo, ring3Mat);
      vaultGroup.add(ring3);

      // 4. Orbiting Satellite Nodes
      const satelliteGroup = new THREE.Group();
      vaultGroup.add(satelliteGroup);

      const satNodes = [];
      const nodeColors = [0x176b50, 0xb8860b, 0x1e5a44, 0xc59b27, 0x245844, 0xa07828];
      const satGeo = new THREE.SphereGeometry(0.20, 16, 16);

      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const radius = 3.15 + (i % 2) * 0.85;
        const satMat = new THREE.MeshPhongMaterial({
          color: nodeColors[i],
          specular: 0xcccccc,
          shininess: 35
        });
        const mesh = new THREE.Mesh(satGeo, satMat);
        mesh.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, 0);
        satNodes.push({ mesh, angle, radius, speed: 0.013 + i * 0.002 });
        satelliteGroup.add(mesh);
      }

      // 5. Constellation Dust / Shimmering particles
      const particleCount = 140;
      const particleGeo = new THREE.BufferGeometry();
      const posArray = new Float32Array(particleCount * 3);
      for (let i = 0; i < particleCount * 3; i += 3) {
        posArray[i] = (Math.random() - 0.5) * 14;
        posArray[i + 1] = (Math.random() - 0.5) * 12;
        posArray[i + 2] = (Math.random() - 0.5) * 8;
      }
      particleGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
      const particleMat = new THREE.PointsMaterial({
        color: 0x8da79b,
        size: 0.045,
        transparent: true,
        opacity: 0.35
      });
      const particles = new THREE.Points(particleGeo, particleMat);
      scene.add(particles);

      // Responsive Camera Distance Calibration (Guarantees zero clipping and balanced margins)
      const updateCamera = (w, h) => {
        if (!camera || !renderer) return;
        const aspect = w / h;
        camera.aspect = aspect;
        const targetSpan = 10.8;
        const fovRad = (camera.fov * Math.PI) / 180;
        const factor = 2 * Math.tan(fovRad / 2);
        const dist = aspect < 1 ? targetSpan / (factor * aspect) : targetSpan / factor;
        camera.position.z = dist;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };

      updateCamera(width, height);

      // Mouse tracking parallax
      let mouseX = 0, mouseY = 0;
      let targetX = 0, targetY = 0;

      const handleMouseMove = (e) => {
        const rect = container.getBoundingClientRect();
        const relX = (e.clientX - rect.left) / (rect.width || 1) - 0.5;
        const relY = (e.clientY - rect.top) / (rect.height || 1) - 0.5;
        targetX = relX * 1.2;
        targetY = relY * 1.2;
      };

      window.addEventListener('mousemove', handleMouseMove);

      const clock = new THREE.Clock();
      const animate = () => {
        if (isCleanedUp) return;
        animationFrameId = requestAnimationFrame(animate);
        const elapsedTime = clock.getElapsedTime();

        mouseX += (targetX - mouseX) * 0.06;
        mouseY += (targetY - mouseY) * 0.06;

        vaultGroup.rotation.y = elapsedTime * 0.38 + mouseX * 1.1;
        vaultGroup.rotation.x = Math.sin(elapsedTime * 0.45) * 0.16 - mouseY * 0.7;
        vaultGroup.position.y = Math.sin(elapsedTime * 1.3) * 0.12;

        jewel.rotation.y = elapsedTime * 1.2;
        jewel.rotation.x = elapsedTime * 0.8;

        ring1.rotation.x = Math.sin(elapsedTime * 0.8) * 0.4;
        ring1.rotation.y = elapsedTime * 0.5;

        ring2.rotation.y = Math.cos(elapsedTime * 0.6) * 0.5;
        ring2.rotation.x = elapsedTime * 0.4;

        ring3.rotation.z = elapsedTime * 0.3;
        ring3.rotation.x = Math.sin(elapsedTime * 0.5) * 0.3;

        satNodes.forEach((node) => {
          node.angle += node.speed;
          node.mesh.position.x = Math.cos(node.angle) * node.radius;
          node.mesh.position.y = Math.sin(node.angle) * node.radius;
          node.mesh.position.z = Math.sin(elapsedTime * 2 + node.angle) * 0.35;
        });

        particles.rotation.y = elapsedTime * 0.04;
        particles.rotation.x = elapsedTime * 0.02;

        renderer.render(scene, camera);
      };

      animate();

      // Resize handling via Window resize & ResizeObserver
      const handleResize = () => {
        if (!container) return;
        const newW = container.clientWidth || 520;
        const newH = container.clientHeight || 560;
        updateCamera(newW, newH);
      };

      window.addEventListener('resize', handleResize);

      let resizeObserver = null;
      if (window.ResizeObserver) {
        resizeObserver = new ResizeObserver((entries) => {
          for (let entry of entries) {
            const { width: crW, height: crH } = entry.contentRect;
            if (crW > 0 && crH > 0) {
              updateCamera(crW, crH);
            }
          }
        });
        resizeObserver.observe(container);
      }

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('resize', handleResize);
        if (resizeObserver) resizeObserver.disconnect();
        if (renderer.domElement && container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
        renderer.dispose();
      };
    };

    let cleanupFn = null;
    if (window.THREE) {
      cleanupFn = initScene();
    } else {
      const script = document.createElement('script');
      script.src = 'https://ajax.googleapis.com/ajax/libs/threejs/r125/three.min.js';
      script.async = true;
      script.onload = () => {
        if (!isCleanedUp) {
          cleanupFn = initScene();
        }
      };
      document.head.appendChild(script);
    }

    return () => {
      isCleanedUp = true;
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (cleanupFn) cleanupFn();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-full min-h-[440px] sm:min-h-[500px] lg:min-h-[560px] bg-transparent flex items-center justify-center relative select-none"
    />
  );
};
