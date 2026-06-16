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

      const paddingLeft = 80;
      const paddingBottom = 60;
      const paddingTop = 40;
      const paddingRight = 40;
      
      const graphWidth = width - paddingLeft - paddingRight;
      const graphHeight = height - paddingBottom - paddingTop;
      
      const startX = paddingLeft;
      const startY = height - paddingBottom;

      const growthRate = 0.06;
      const currentT = Math.log(multiplier) / growthRate;
      
      const maxT = Math.max(10, Math.ceil(currentT / 5) * 5 + 5); 
      const maxM = Math.max(2, Math.ceil(multiplier / 2) * 2 + 1);

      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      
      for (let i = 0; i <= 5; i++) {
        const y = startY - (graphHeight * (i / 5));
        ctx.beginPath();
        ctx.moveTo(startX, y);
        ctx.lineTo(startX + graphWidth, y);
        ctx.stroke();
      }
      
      for (let i = 0; i <= 5; i++) {
        const x = startX + (graphWidth * (i / 5));
        ctx.beginPath();
        ctx.moveTo(x, startY);
        ctx.lineTo(x, paddingTop);
        ctx.stroke();
      }

      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.font = '500 12px font-mono, monospace';
      
      ctx.textAlign = 'right';
      for (let i = 0; i <= 5; i++) {
        const m = 1 + ((maxM - 1) * (i / 5));
        const y = startY - (graphHeight * (i / 5));
        ctx.fillText(m.toFixed(1) + 'x', startX - 15, y + 4);
      }

      ctx.textAlign = 'center';
      for (let i = 0; i <= 5; i++) {
        const t = maxT * (i / 5);
        const x = startX + (graphWidth * (i / 5));
        ctx.fillText(t.toFixed(0) + 's', x, startY + 20);
      }

      if (status === RoundStatus.IN_PROGRESS || status === RoundStatus.CRASHED) {
        const points: {x: number, y: number}[] = [];
        const steps = 100;
        
        for (let i = 0; i <= steps; i++) {
          const t = currentT * (i / steps);
          const m = Math.exp(growthRate * t);
          
          const x = startX + (t / maxT) * graphWidth;
          const y = startY - ((m - 1) / (maxM - 1)) * graphHeight;
          
          points.push({ x, y });
        }

        if (points.length > 1) {
          const lastPoint = points[points.length - 1];

          const fillGradient = ctx.createLinearGradient(0, startY, 0, lastPoint.y);
          fillGradient.addColorStop(0, 'rgba(239, 68, 68, 0)');
          fillGradient.addColorStop(1, status === RoundStatus.CRASHED ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.08)');
          
          ctx.beginPath();
          ctx.fillStyle = fillGradient;
          ctx.moveTo(startX, startY);
          for (const p of points) ctx.lineTo(p.x, p.y);
          ctx.lineTo(lastPoint.x, startY);
          ctx.closePath();
          ctx.fill();

          ctx.beginPath();
          ctx.strokeStyle = status === RoundStatus.CRASHED ? '#ef4444' : '#ef4444'; 
          ctx.lineWidth = 4;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          
          if (status !== RoundStatus.CRASHED) {
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#ef4444';
          }

          ctx.moveTo(points[0].x, points[0].y);
          for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
          }
          ctx.stroke();
          ctx.shadowBlur = 0;

          if (status === RoundStatus.IN_PROGRESS) {
             ctx.fillStyle = '#ffffff';
             ctx.shadowBlur = 20;
             ctx.shadowColor = '#ef4444';
             ctx.beginPath();
             ctx.arc(lastPoint.x, lastPoint.y, 5, 0, Math.PI * 2);
             ctx.fill();
             ctx.shadowBlur = 0;
          }
        }
      }

      ctx.fillStyle = status === RoundStatus.CRASHED ? '#ef4444' : '#ffffff';
      ctx.font = '900 120px "Inter", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      if (status !== RoundStatus.CRASHED) {
        ctx.shadowBlur = 30;
        ctx.shadowColor = 'rgba(255, 255, 255, 0.15)';
      }
      
      let text = multiplier.toFixed(2) + 'x';
      if (status === RoundStatus.WAITING_FOR_BETS) {
        ctx.font = '900 60px "Inter", system-ui, sans-serif';
        text = 'AGUARDANDO...';
      }
      if (status === RoundStatus.STARTING) {
        ctx.font = '900 60px "Inter", system-ui, sans-serif';
        text = 'COMEÇANDO...';
      }
      
      ctx.fillText(text, width / 2, height / 2 - 20);
      ctx.shadowBlur = 0;

      animationFrame = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationFrame);
  }, [multiplier, status]);

  return (
    <div className="w-full h-full p-2 bg-[#0c0c0e]">
      <canvas 
        ref={canvasRef} 
        width={1000} 
        height={600} 
        className="w-full h-full object-contain"
      />
    </div>
  );
}
