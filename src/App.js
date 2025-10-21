import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';

export default function LaserAngleCalculator() {
  const [laserDepth, setLaserDepth] = useState(0);
  const [laserHeight, setLaserHeight] = useState(10);
  const [laserAngle, setLaserAngle] = useState(-45); // 下向き角度（正の値）
  const [laserSpread] = useState(50); // 固定50度
  const [performerDepth, setPerformerDepth] = useState(5);
  const [performerHeight, setPerformerHeight] = useState(1.7);
  const [performerRadius, setPerformerRadius] = useState(0.3);

  // ステージサイズ
  const stageDepth = 20;
  const stageHeight = 20;
  const scale = 20;

  // レーザーの照射範囲を計算
  const calculateLaserBeam = () => {
    const angleRad = (laserAngle * Math.PI) / 180;
    const spreadRad = (laserSpread * Math.PI) / 180;
    
    const leftAngle = angleRad - spreadRad / 2;
    const rightAngle = angleRad + spreadRad / 2;
    
    const beamLength = 30;
    
    const leftDepth = laserDepth + Math.cos(leftAngle) * beamLength;
    const leftHeight = laserHeight + Math.sin(leftAngle) * beamLength;
    const rightDepth = laserDepth + Math.cos(rightAngle) * beamLength;
    const rightHeight = laserHeight + Math.sin(rightAngle) * beamLength;
    
    return { leftDepth, leftHeight, rightDepth, rightHeight };
  };

  // 演者がレーザー範囲内にいるかチェック（上端のみ）
  const checkIntersection = () => {
    const lowerEdgeAngle = laserAngle + (laserSpread / 2); // より上向き（床に近い側）が上端
    const angleRad = (lowerEdgeAngle * Math.PI) / 180;
    
    // レーザーから演者への角度を計算
    const dDepth = performerDepth - laserDepth;
    const dHeight = performerHeight - laserHeight; // 演者の高さ - レーザーの高さ
    
    if (dDepth <= 0) return false; // 演者がレーザーより後ろにいる
    
    const angleToPerformerTop = Math.atan2(dHeight, dDepth);
    
    // 上端のビームが演者の頭に当たるかチェック
    const angleDiff = Math.abs(angleToPerformerTop - angleRad);
    
    // 演者の幅を考慮した判定（約5度の余裕）
    return angleDiff < (5 * Math.PI / 180);
  };

  const beam = calculateLaserBeam();
  const isInBeam = checkIntersection();
  
  // 演者までの距離と角度
  const dDepth = performerDepth - laserDepth;
  const dHeight = laserHeight - performerHeight;
  const distance = Math.sqrt(dDepth * dDepth + dHeight * dHeight);
  const angleToPerformer = (Math.atan2(dHeight, dDepth) * 180 / Math.PI);
  
  // レーザーの上下端が床に当たる位置を計算
  const calculateFloorIntersection = (angle) => {
    const angleRad = (angle * Math.PI) / 180;
    const sinAngle = Math.sin(angleRad);
    
    // 下向き成分がない（sin(angle) >= 0）場合は床に当たらない
    if (sinAngle >= 0) return null;
    
    // 床までの高さをsin/cosで計算
    const distance = laserHeight / Math.abs(sinAngle);
    const depthToFloor = distance * Math.cos(angleRad);
    
    return laserDepth + depthToFloor;
  };
  
  const upperEdgeAngle = laserAngle - (laserSpread / 2);
  const lowerEdgeAngle = laserAngle + (laserSpread / 2);
  
  const upperFloorDepth = calculateFloorIntersection(upperEdgeAngle);
  const lowerFloorDepth = calculateFloorIntersection(lowerEdgeAngle);
  
  // レーザーから演者の頭上+0.3mを通る線が床に落ちる位置を計算
  const calculatePerformerLineFloor = () => {
    const safetyMargin = 0.3; // 安全マージン
    const dDepth = performerDepth - laserDepth;
    const dHeight = (performerHeight + performerRadius + safetyMargin) - laserHeight; // 演者の頭頂部+0.3m
    
    if (dDepth <= 0 || dHeight >= 0) return null; // 演者が後ろまたは上にいる
    
    // 床までの距離を計算
    const angleToPerformerTop = Math.atan2(dHeight, dDepth);
    const remainingHeight = performerHeight + performerRadius + safetyMargin; // 頭頂部+0.3mから床までの高さ
    const depthFromPerformer = remainingHeight / Math.abs(Math.tan(angleToPerformerTop));
    
    return performerDepth + depthFromPerformer;
  };
  
  const performerLineFloorDepth = calculatePerformerLineFloor();

  return (
    <div className="w-full max-w-6xl mx-auto p-6 bg-gray-900 text-white">
      <h1 className="text-3xl font-bold mb-6 text-center">ステージレーザー照射範囲計算ツール</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 左側：ビジュアル表示 */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">ステージビュー（横から見た図）</h2>
          <svg 
            width={stageDepth * scale} 
            height={stageHeight * scale}
            className="border-2 border-gray-600 bg-gray-950 mx-auto"
          >
            {/* グリッド */}
            {[...Array(21)].map((_, i) => (
              <g key={`v${i}`}>
                <line 
                  x1={i * scale} y1={0} 
                  x2={i * scale} y2={stageHeight * scale}
                  stroke="#333" strokeWidth="1"
                />
              </g>
            ))}
            {[...Array(21)].map((_, i) => (
              <g key={`h${i}`}>
                <line 
                  x1={0} y1={i * scale}
                  x2={stageDepth * scale} y2={i * scale}
                  stroke="#333" strokeWidth="1"
                />
              </g>
            ))}
            
            {/* 床 */}
            <line 
              x1={0} y1={stageHeight * scale}
              x2={stageDepth * scale} y2={stageHeight * scale}
              stroke="#666" strokeWidth="3"
            />
            <text
              x={10}
              y={stageHeight * scale - 5}
              fill="#666"
              fontSize="12"
            >
              ステージ床面
            </text>
            
            {/* レーザー照射範囲 */}
            <polygon
              points={`${laserDepth * scale},${(stageHeight - laserHeight) * scale} ${beam.leftDepth * scale},${(stageHeight - beam.leftHeight) * scale} ${beam.rightDepth * scale},${(stageHeight - beam.rightHeight) * scale}`}
              fill="rgba(255,255,0,0.2)"
              stroke="#ffff00"
              strokeWidth="2"
            />
            
            {/* レーザーから演者の頭上+0.3mを通る線 */}
            <line
              x1={laserDepth * scale}
              y1={(stageHeight - laserHeight) * scale}
              x2={performerDepth * scale}
              y2={(stageHeight - performerHeight - performerRadius - 0.3) * scale}
              stroke="#00ffff"
              strokeWidth="2"
              strokeDasharray="3,3"
            />
            
            {/* 演者の頭上+0.3mから床への延長線 */}
            {performerLineFloorDepth !== null && performerLineFloorDepth >= 0 && performerLineFloorDepth <= stageDepth && (
              <line
                x1={performerDepth * scale}
                y1={(stageHeight - performerHeight - performerRadius - 0.3) * scale}
                x2={performerLineFloorDepth * scale}
                y2={stageHeight * scale}
                stroke="#00ffff"
                strokeWidth="2"
                strokeDasharray="3,3"
              />
            )}
            
            {/* レーザー本体（釣り下げ） */}
            <line
              x1={laserDepth * scale}
              y1={0}
              x2={laserDepth * scale}
              y2={(stageHeight - laserHeight) * scale}
              stroke="#4ade80"
              strokeWidth="2"
              strokeDasharray="5,5"
            />
            <rect
              x={laserDepth * scale - 12}
              y={(stageHeight - laserHeight) * scale - 15}
              width="24"
              height="30"
              fill="#22c55e"
              stroke="#16a34a"
              strokeWidth="2"
              rx="3"
            />
            <text
              x={laserDepth * scale}
              y={(stageHeight - laserHeight) * scale - 20}
              textAnchor="middle"
              fill="#4ade80"
              fontSize="12"
              fontWeight="bold"
            >
              レーザー
            </text>
            <text
              x={laserDepth * scale + 20}
              y={(stageHeight - laserHeight) * scale}
              fill="#4ade80"
              fontSize="11"
            >
              {laserHeight.toFixed(1)}m
            </text>
            
            {/* 演者 */}
            <ellipse
              cx={performerDepth * scale}
              cy={(stageHeight - performerHeight - performerRadius) * scale}
              rx={performerRadius * scale}
              ry={performerRadius * scale}
              fill="#3b82f6"
              stroke="#2563eb"
              strokeWidth="2"
            />
            <rect
              x={performerDepth * scale - performerRadius * scale * 0.7}
              y={(stageHeight - performerHeight) * scale}
              width={performerRadius * scale * 1.4}
              height={performerHeight * scale}
              fill="#60a5fa"
              stroke="#2563eb"
              strokeWidth="2"
              rx="3"
            />
            <text
              x={performerDepth * scale}
              y={(stageHeight - performerHeight - performerRadius) * scale - 10}
              textAnchor="middle"
              fill="#3b82f6"
              fontSize="12"
              fontWeight="bold"
            >
              演者
            </text>
            <text
              x={performerDepth * scale - 25}
              y={(stageHeight - performerHeight/2) * scale}
              fill="#3b82f6"
              fontSize="11"
            >
              {performerHeight.toFixed(1)}m
            </text>
            
            {/* 床への照射位置表示 */}
            {upperFloorDepth !== null && upperFloorDepth >= 0 && upperFloorDepth <= stageDepth && (
              <>
                <circle
                  cx={upperFloorDepth * scale}
                  cy={stageHeight * scale}
                  r="4"
                  fill="#ff6b6b"
                  stroke="#ff0000"
                  strokeWidth="2"
                />
                <text
                  x={upperFloorDepth * scale}
                  y={stageHeight * scale + 15}
                  textAnchor="middle"
                  fill="#ff6b6b"
                  fontSize="11"
                  fontWeight="bold"
                >
                  下端: {upperFloorDepth.toFixed(2)}m
                </text>
              </>
            )}
            
            {lowerFloorDepth !== null && lowerFloorDepth >= 0 && lowerFloorDepth <= stageDepth && (
              <>
                <circle
                  cx={lowerFloorDepth * scale}
                  cy={stageHeight * scale}
                  r="4"
                  fill="#ffa94d"
                  stroke="#ff8800"
                  strokeWidth="2"
                />
                <text
                  x={lowerFloorDepth * scale}
                  y={stageHeight * scale - 8}
                  textAnchor="middle"
                  fill="#ffa94d"
                  fontSize="11"
                  fontWeight="bold"
                >
                  上端: {lowerFloorDepth.toFixed(2)}m
                </text>
              </>
            )}
            
            {/* レーザー→演者の線が床に落ちる位置 */}
            {performerLineFloorDepth !== null && performerLineFloorDepth >= 0 && performerLineFloorDepth <= stageDepth && (
              <>
                <circle
                  cx={performerLineFloorDepth * scale}
                  cy={stageHeight * scale}
                  r="5"
                  fill="#00ffff"
                  stroke="#00cccc"
                  strokeWidth="2"
                />
                <text
                  x={performerLineFloorDepth * scale}
                  y={stageHeight * scale + 25}
                  textAnchor="middle"
                  fill="#00ffff"
                  fontSize="11"
                  fontWeight="bold"
                >
                  頭上+0.3m: {performerLineFloorDepth.toFixed(2)}m
                </text>
              </>
            )}
          </svg>
          
          {/* 警告表示 */}
          {isInBeam && (
            <div className="mt-4 p-3 bg-red-900 border-2 border-red-500 rounded flex items-center gap-2">
              <AlertCircle className="text-red-400" />
              <span className="font-semibold text-red-200">警告: レーザー上端が演者に掠っています！</span>
            </div>
          )}
          
          {/* 計算結果 */}
          <div className="mt-4 p-3 bg-gray-700 rounded">
            <h3 className="font-semibold mb-2">計算結果</h3>
            <div className="text-sm space-y-1">
              <p>レーザー→演者の距離: <span className="font-mono text-cyan-300">{distance.toFixed(2)}m</span></p>
              <p>レーザー→演者の角度: <span className="font-mono text-cyan-300">{angleToPerformer.toFixed(1)}°</span></p>
              <p>レーザー照射角度: <span className="font-mono text-cyan-300">{laserAngle.toFixed(1)}°</span></p>
              <p>照射範囲（広がり）: <span className="font-mono text-yellow-300">{laserSpread}° 固定</span></p>
            </div>
          </div>
          
          {/* 床への照射位置 */}
          <div className="mt-4 p-3 bg-gray-700 rounded">
            <h3 className="font-semibold mb-2">床への照射位置</h3>
            <div className="text-sm space-y-1">
              {upperFloorDepth !== null && upperFloorDepth >= 0 && upperFloorDepth <= stageDepth ? (
                <p>レーザー下端: <span className="font-mono text-red-400">{upperFloorDepth.toFixed(2)}m</span></p>
              ) : (
                <p className="text-gray-400">レーザー下端: 床に到達しません</p>
              )}
              {lowerFloorDepth !== null && lowerFloorDepth >= 0 && lowerFloorDepth <= stageDepth ? (
                <p>レーザー上端: <span className="font-mono text-orange-400">{lowerFloorDepth.toFixed(2)}m</span></p>
              ) : (
                <p className="text-gray-400">レーザー上端: 床に到達しません</p>
              )}
              {performerLineFloorDepth !== null && performerLineFloorDepth >= 0 && performerLineFloorDepth <= stageDepth ? (
                <p>頭上+0.3m通過: <span className="font-mono text-cyan-400">{performerLineFloorDepth.toFixed(2)}m</span></p>
              ) : (
                <p className="text-gray-400">頭上+0.3m通過: 床に到達しません</p>
              )}
              {upperFloorDepth !== null && lowerFloorDepth !== null && 
               upperFloorDepth >= 0 && upperFloorDepth <= stageDepth &&
               lowerFloorDepth >= 0 && lowerFloorDepth <= stageDepth && (
                <p className="mt-2 pt-2 border-t border-gray-600">
                  床の照射幅: <span className="font-mono text-cyan-300">{Math.abs(lowerFloorDepth - upperFloorDepth).toFixed(2)}m</span>
                </p>
              )}
            </div>
          </div>
        </div>
        
        {/* 右側：パラメータ設定 */}
        <div className="space-y-6">
          <div className="bg-gray-800 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-4 text-green-400">レーザー設定</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  奥行き位置: <span className="text-cyan-300 font-mono">{laserDepth.toFixed(1)}m</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max={stageDepth}
                  step="0.1"
                  value={laserDepth}
                  onChange={(e) => setLaserDepth(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  高さ（釣り下げ位置）: <span className="text-cyan-300 font-mono">{laserHeight.toFixed(1)}m</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max={stageHeight}
                  step="0.1"
                  value={laserHeight}
                  onChange={(e) => setLaserHeight(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  照射角度: <span className="text-cyan-300 font-mono">{laserAngle.toFixed(1)}°</span>
                </label>
                <input
                  type="range"
                  min="-90"
                  max="90"
                  step="1"
                  value={laserAngle}
                  onChange={(e) => setLaserAngle(parseFloat(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>上向き-90°</span>
                  <span>水平0°</span>
                  <span>下向き+90°</span>
                </div>
              </div>
              
              <div className="p-3 bg-yellow-900 border border-yellow-600 rounded">
                <p className="text-sm text-yellow-200">
                  <span className="font-semibold">照射範囲: 50° 固定</span>
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-4 text-blue-400">演者設定</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  奥行き位置: <span className="text-cyan-300 font-mono">{performerDepth.toFixed(1)}m</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max={stageDepth}
                  step="0.1"
                  value={performerDepth}
                  onChange={(e) => setPerformerDepth(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  身長: <span className="text-cyan-300 font-mono">{performerHeight.toFixed(2)}m</span>
                </label>
                <input
                  type="range"
                  min="1.5"
                  max="2.0"
                  step="0.01"
                  value={performerHeight}
                  onChange={(e) => setPerformerHeight(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  演者の幅（安全範囲）: <span className="text-cyan-300 font-mono">{performerRadius.toFixed(2)}m</span>
                </label>
                <input
                  type="range"
                  min="0.2"
                  max="1.0"
                  step="0.05"
                  value={performerRadius}
                  onChange={(e) => setPerformerRadius(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800 p-4 rounded-lg text-sm text-gray-300">
            <h3 className="font-semibold mb-2">使い方</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>横から見た側面図で表示</li>
              <li>レーザーは天井から釣り下げる形で配置</li>
              <li>照射角度は-90°（上向き）〜+90°（下向き）で調整可能</li>
              <li>照射範囲は50°で固定</li>
              <li>演者の位置・身長を調整して照射範囲を確認</li>
              <li>奥行き・高さは0〜20mの範囲で設定可能</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}