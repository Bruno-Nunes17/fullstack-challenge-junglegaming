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

      const paddingLeft = 70;
      const paddingBottom = 60;
      const paddingTop = 40;
      const paddingRight = 40;
      
      const graphWidth = width - paddingLeft - paddingRight;
      const graphHeight = height - paddingBottom - paddingTop;
      
      const startX = paddingLeft;
      const startY = height - paddingBottom;

      const currentT = Math.log(multiplier) / 0.06;
      
      const maxT = Math.max(10, Math.ceil(currentT / 5) * 5 + 5); 
      const maxM = Math.max(2, Math.ceil(multiplier / 2) * 2 + 1);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(startX, paddingTop);
      ctx.lineTo(startX, startY);
      ctx.lineTo(startX + graphWidth, startY);
      ctx.stroke();

      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.font = 'bold 14px Inter, system-ui, sans-serif';

      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      const mDivisions = 5;
      for (let i = 0; i <= mDivisions; i++) {
        const m = 1 + ((maxM - 1) * (i / mDivisions));
        const y = startY - (graphHeight * (i / mDivisions));
        
        ctx.beginPath();
        ctx.moveTo(startX - 5, y);
        ctx.lineTo(startX + graphWidth, y);
        ctx.stroke();
        
        ctx.fillText(m.toFixed(1) + 'x', startX - 15, y);
      }

      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      const tDivisions = 5;
      for (let i = 0; i <= tDivisions; i++) {
        const t = maxT * (i / tDivisions);
        const x = startX + (graphWidth * (i / tDivisions));
        
        ctx.beginPath();
        ctx.moveTo(x, startY + 5);
        ctx.lineTo(x, paddingTop);
        ctx.stroke();
        
        ctx.fillText(t.toFixed(0) + 's', x, startY + 15);
      }

      if (status === RoundStatus.IN_PROGRESS || status === RoundStatus.CRASHED) {
        const points: {x: number, y: number}[] = [];
        const steps = 100;
        
        for (let i = 0; i <= steps; i++) {
          const t = currentT * (i / steps);
          const m = Math.exp(0.06 * t);
          
          const x = startX + (t / maxT) * graphWidth;
          const y = startY - ((m - 1) / (maxM - 1)) * graphHeight;
          
          points.push({ x, y });
        }

        if (points.length > 1) {
          const lastPoint = points[points.length - 1];

          const gradient = ctx.createLinearGradient(0, startY, 0, lastPoint.y);
          gradient.addColorStop(0, 'rgba(16, 185, 129, 0)');
          gradient.addColorStop(1, status === RoundStatus.CRASHED ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)');
          
          ctx.beginPath();
          ctx.fillStyle = gradient;
          ctx.moveTo(startX, startY);
          for (const p of points) ctx.lineTo(p.x, p.y);
          ctx.lineTo(lastPoint.x, startY);
          ctx.closePath();
          ctx.fill();

          ctx.beginPath();
          ctx.strokeStyle = status === RoundStatus.CRASHED ? '#ef4444' : '#10b981';
          ctx.lineWidth = 5;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          
          if (status !== RoundStatus.CRASHED) {
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#10b981';
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
             ctx.shadowColor = '#10b981';
             ctx.beginPath();
             ctx.arc(lastPoint.x, lastPoint.y, 6, 0, Math.PI * 2);
             ctx.fill();
             ctx.shadowBlur = 0;
          }
        }
      }

      ctx.fillStyle = status === RoundStatus.CRASHED ? '#ef4444' : '#ffffff';
      ctx.font = '900 90px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowBlur = 20;
      ctx.shadowColor = status === RoundStatus.CRASHED ? '#ef4444' : 'rgba(255,255,255,0.3)';
      
      let text = multiplier.toFixed(2) + 'x';
      if (status === RoundStatus.WAITING_FOR_BETS) text = 'AGUARDANDO...';
      if (status === RoundStatus.STARTING) text = 'COMEÇANDO...';
      
      ctx.fillText(text, width / 2, height / 2 - 40);
      ctx.shadowBlur = 0;

      animationFrame = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationFrame);
  }, [multiplier, status]);

  return (
    <div className="w-full h-full p-4">
      <canvas 
        ref={canvasRef} 
        width={1000} 
        height={600} 
        className="w-full h-full object-contain"
      />
    </div>
  );
}
