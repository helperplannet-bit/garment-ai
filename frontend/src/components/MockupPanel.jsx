import React, { useEffect, useRef, useState } from "react";
import useEditorStore from "../store/useEditorStore";
import { listMockups, generateMockup } from "../api/client";
import "./MockupPanel.css";

const MockupPanel = () => {
  const { activePanel, setActivePanel, canvas: mainCanvas } = useEditorStore();
  const [mockups, setMockups] = useState([]);
  const [selectedMockup, setSelectedMockup] = useState("");
  const [loading, setLoading] = useState(false);
  const mockupCanvasRef = useRef(null);
  const [miniCanvas, setMiniCanvas] = useState(null);
  const [resultImg, setResultImg] = useState(null);

  useEffect(() => {
    if (activePanel === "mockup") {
      listMockups().then(res => {
        setMockups(res.data.mockups);
        if (res.data.mockups.length > 0 && !selectedMockup) {
           setSelectedMockup(res.data.mockups[0]);
        }
      });
    }
  }, [activePanel]);

  // Init mini-canvas
  useEffect(() => {
      if (activePanel === "mockup" && !miniCanvas && mockupCanvasRef.current) {
          const { fabric } = window;
          const c = new fabric.Canvas(mockupCanvasRef.current, {
              width: 300, height: 400, backgroundColor: "#1c1c1e"
          });
          setMiniCanvas(c);
      }
      return () => {
          if (activePanel !== "mockup" && miniCanvas) {
              miniCanvas.dispose();
              setMiniCanvas(null);
          }
      };
  }, [activePanel]);

  // Map Main Canvas payload onto Mini Canvas when Mockup Panel opens
  useEffect(() => {
      if (activePanel === "mockup" && miniCanvas && mainCanvas && selectedMockup) {
          const { fabric } = window;
          miniCanvas.clear();
          miniCanvas.backgroundColor = "#1c1c1e";

          // Load background mockup shirt
          fabric.Image.fromURL(`http://localhost:8000/mockups/${selectedMockup}`, (bgImg) => {
              // Scale shirt to fit mini canvas
              const scale = 300 / bgImg.width;
              bgImg.set({ scaleX: scale, scaleY: scale, selectable: false });
              miniCanvas.add(bgImg);
              miniCanvas.centerObject(bgImg);
              
              // Load design from main canvas
              const designB64 = mainCanvas.toDataURL({format: 'png', multiplier: 1});
              fabric.Image.fromURL(designB64, (designImg) => {
                  // Scale design initially to look like a shirt graphic (e.g., 40% of shirt width)
                  const dScale = (300 * 0.4) / designImg.width;
                  designImg.set({ scaleX: dScale, scaleY: dScale, top: 100, left: 90, borderColor: '#2DD4BF', cornerColor: '#7C3AED' });
                  miniCanvas.add(designImg);
                  miniCanvas.setActiveObject(designImg);
                  miniCanvas.renderAll();
              }, { crossOrigin: 'anonymous' });

          }, { crossOrigin: 'anonymous' });
      }
  }, [activePanel, miniCanvas, selectedMockup]);

  const handleGenerate = async () => {
      if (!miniCanvas || !mainCanvas) return;
      
      const designObj = miniCanvas.getObjects().find(o => o.selectable);
      const bgObj = miniCanvas.getObjects().find(o => !o.selectable);
      
      if(!designObj || !bgObj) return;

      setLoading(true);
      try {
          // Calculate relative positions!
          // We need to map the mini-canvas position back to 0-1 relative bounds of the original background image
          const rawBgWidth = bgObj.width * bgObj.scaleX;
          const rawBgHeight = bgObj.height * bgObj.scaleY;
          
          // design bounding rect
          const bound = designObj.getBoundingRect();
          
          // distance from top-left of the shirt image visually mapping to percentage 0.0-1.0
          const relX = (bound.left - bgObj.left) / rawBgWidth;
          const relY = (bound.top - bgObj.top) / rawBgHeight;
          const relScale = bound.width / rawBgWidth;

          // Main canvas payload (high res)
          const b64 = mainCanvas.toDataURL({ format: "png", multiplier: 1 }).split(",")[1];
          
          const res = await generateMockup(b64, selectedMockup, relX, relY, relScale);
          setResultImg(res.data.image_base64);
      } catch(e) {
          console.error(e);
          alert("Mockup generation failed");
      }
      setLoading(false);
  };

  if (activePanel !== "mockup") return null;

  return (
    <div className="gafs-mockup-panel">
      <div className="gafs-ai-panel__header">
        <h3>Live Mockup Preview</h3>
        <button className="gafs-icon-btn" onClick={() => setActivePanel(null)}>✕</button>
      </div>

      <div style={{padding: '16px'}}>
          <label style={{fontSize: '11px', color: 'var(--text-secondary)'}}>SELECT APPAREL</label>
          <select className="gafs-input mt-2 mb-4" value={selectedMockup} onChange={e => setSelectedMockup(e.target.value)}>
            {mockups.map(m => ( <option key={m} value={m}>{m.replace('.png', '')}</option> ))}
          </select>
          
          <div className="gafs-mockup-canvas-wrapper" style={{ boxShadow:'0 4px 12px rgba(0,0,0,0.5)', borderRadius:'8px', overflow:'hidden', border:'1px solid var(--border)'}}>
             <canvas ref={mockupCanvasRef} />
          </div>
          
          <p className="text-xs text-muted mt-2" style={{textAlign:'center'}}>Drag and scale the bounding box precisely onto the T-shirt.</p>

          <button className="gafs-btn-primary mt-2" style={{width:'100%'}} onClick={handleGenerate} disabled={loading}>
            {loading ? "Compositing High-Res..." : "Generate Final Mockup"}
          </button>
      </div>

      {resultImg && (
          <div className="gafs-mockup-result">
              <h4 style={{padding: '0 16px', margin:'10px 0', fontSize:'12px', color:'var(--accent-teal)'}}>High-Res Result</h4>
              <img src={`data:image/png;base64,${resultImg}`} style={{width:'100%'}} alt="Mockup" />
              <button 
                  className="gafs-btn-outline" 
                  style={{margin:'10px 16px', width:'calc(100% - 32px)'}}
                  onClick={() => {
                      const a = document.createElement("a"); 
                      a.href=`data:image/png;base64,${resultImg}`; 
                      a.download="mockup-export.png"; 
                      a.click();
                  }}
              >
                  Download HD Mockup
              </button>
          </div>
      )}
    </div>
  );
};

export default MockupPanel;
