function drawHUD(speed = 49, fuel = 78, rpm = 3500, gear = 3, temp = 85) {
    const canvas = document.getElementById('hudCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 动态背景效果
    ctx.fillStyle = 'rgba(10, 25, 47, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 外圈 
    ctx.beginPath();
    ctx.arc(190, 110, 75, Math.PI, 2 * Math.PI, false);
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#ff6699';
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#ff6699';
    ctx.stroke();

    // 金属装饰环
    ctx.beginPath();
    ctx.arc(190, 110, 70, Math.PI, 2 * Math.PI, false);
    ctx.lineWidth = 3;
    const gradient = ctx.createLinearGradient(0, 0, 380, 0);
    gradient.addColorStop(0, '#ff6699');
    gradient.addColorStop(1, '#ff6699');
    ctx.strokeStyle = gradient;
    ctx.stroke();

    // 速度表 - 全息投影效果
    ctx.save();
    ctx.translate(190, 110);
    ctx.rotate(Math.PI);
    ctx.beginPath();
    let angle = (speed / 180) * Math.PI;
    ctx.arc(0, 0, 65, 0, angle, false);
    ctx.lineWidth = 8;
    ctx.strokeStyle = 'rgb(254, 254, 254)';
    ctx.shadowBlur = 15;
    ctx.shadowColor = 'rgb(254, 254, 254)';
    ctx.stroke();
    ctx.restore();

    // 速度数字 - 全息显示
    ctx.font = "bold 36px 'Digital-7', Arial";
    ctx.fillStyle = "#ff6699";
    ctx.shadowBlur = 10;
    ctx.shadowColor = "#ff6699";
    ctx.textAlign = "center";
    ctx.fillText(speed, 190, 120);

    // 单位标签
    ctx.font = "bold 14px 'Agency FB'";
    ctx.fillStyle = "#ff6699";
    ctx.shadowColor = "#ff6699";
    ctx.fillText("km/h", 190, 145);

    // 左侧显示所有额外信息
    ctx.font = "bold italic 14px 'Agency FB'";
    ctx.fillStyle = "#ff6699";
    ctx.textAlign = "right";

    // 转速
    ctx.fillText("转速: " + rpm + " RPM", 100, 70);

    // 挡位
    ctx.fillText("挡位: " + gear, 100, 90);

    // 油量
    ctx.fillText("油量: " + fuel + "%", 100, 110);

    // 温度
    ctx.fillText("温度: " + temp + "°C", 100, 130);

    // 动态扫描线
    ctx.beginPath();
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(255, 102, 153, 0.3)';
    for(let y = 0; y < canvas.height; y += 4) {
        ctx.moveTo(0, y + (Date.now()/50 % 4));
        ctx.lineTo(canvas.width, y + (Date.now()/50 % 4));
    }
    ctx.stroke();

    // 危险警告（低油量时闪烁）
    if(fuel < 20) {
        ctx.fillStyle = `rgba(255, 0, 0, ${0.5 + Math.abs(Math.sin(Date.now()/200))/2})`;
        ctx.beginPath();
        ctx.arc(190, 180, 10, 0, Math.PI*2);
        ctx.fill();
    }

    // 刻度线
    ctx.strokeStyle = '#ff6699';
    ctx.lineWidth = 2;
    for(let i = 0; i <= 180; i += 10) {
        ctx.save();
        ctx.translate(190, 110);
        ctx.rotate(Math.PI + (i/180)*Math.PI);
        ctx.beginPath();
        ctx.moveTo(60, 0);
        ctx.lineTo(70, 0);
        ctx.stroke();
        ctx.restore();
    }
}

// 添加CSS动画
const style = document.createElement('style');
style.textContent = `
    @keyframes neonPulse {
        0%, 100% { filter: drop-shadow(0 0 5px #ff6699); }
        50% { filter: drop-shadow(0 0 20px #ff6699); }
    }
    #hudCanvas {
        animation: neonPulse 2s infinite;
        border: 1px solid #ff6699;
        border-radius: 15px;
        background: rgba(10, 25, 47, 0.8);
        box-shadow: 0 0 30px rgba(255, 102, 153, 0.2);
    }
`;
document.head.appendChild(style);
drawHUD();