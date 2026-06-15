import { useEffect, useRef } from 'react';
import { useGameStore, RoundStatus } from '../stores/useGameStore';

export function CrashCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { multiplier, status } = useGameStore();
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrame: number;

    const render = () => {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      for (let i = 0; i < width; i += 50) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, height);
        ctx.stroke();
      }
      for (let i = 0; i < height; i += 50) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(width, i);
        ctx.stroke();
      }

      if (status === RoundStatus.IN_PROGRESS || status === RoundStatus.CRASHED) {
        const padding = 50;
        const startX = padding;
        const startY = height - padding;
        const currentM = Math.min(multiplier, 10);
        
        const points: {x: number, y: number}[] = [];
        const steps = 50;
        
        for (let i = 0; i <= steps; i++) {
          const t = i / steps;
          const mAtT = 1 + (currentM - 1) * t;
          const x = startX + (width - padding * 2) * t;
          const y = startY - (height - padding * 2) * (Math.pow(mAtT, 0.5) - 1) / (Math.pow(10, 0.5) - 1);
          points.push({ x, y });
        }

        
        const gradient = ctx.createLinearGradient(0, startY, 0, points[points.length-1].y);
        gradient.addColorStop(0, 'transparent');
        gradient.addColorStop(1, status === RoundStatus.CRASHED ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)');
        
        ctx.beginPath();
        ctx.fillStyle = gradient;
        ctx.moveTo(points[0].x, startY);
        for (const p of points) ctx.lineTo(p.x, p.y);
        ctx.lineTo(points[points.length-1].x, startY);
        ctx.closePath();
        ctx.fill();

        
        ctx.beginPath();
        ctx.strokeStyle = status === RoundStatus.CRASHED ? '#ef4444' : '#10b981';
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowBlur = 20;
        ctx.shadowColor = status === RoundStatus.CRASHED ? '#ef4444' : '#10b981';

        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
          ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        if (status === RoundStatus.IN_PROGRESS) {
           const lastPoint = points[points.length - 1];
           ctx.fillStyle = '#10b981';
           ctx.beginPath();
           ctx.arc(lastPoint.x, lastPoint.y, 8, 0, Math.PI * 2);
           ctx.fill();
        }
      }

      ctx.fillStyle = status === RoundStatus.CRASHED ? '#ef4444' : '#ffffff';
      ctx.font = 'black 90px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowBlur = status === RoundStatus.CRASHED ? 30 : 15;
      ctx.shadowColor = status === RoundStatus.CRASHED ? '#ef4444' : 'rgba(255,255,255,0.3)';
      
      let text = multiplier.toFixed(2) + 'x';
      if (status === RoundStatus.WAITING_FOR_BETS) text = 'AGUARDANDO...';
      if (status === RoundStatus.STARTING) text = 'COMEÇANDO...';
      
      ctx.fillText(text, width / 2, height / 2);
      ctx.shadowBlur = 0;

      animationFrame = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationFrame);
  }, [multiplier, status]);

  return (
    <canvas 
      ref={canvasRef} 
      width={800} 
      height={500} 
      className="w-full h-full object-contain"
    />
  );
}
