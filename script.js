/* ===== RESET ===== */
*{
  margin:0;
  padding:0;
  box-sizing:border-box;
}

html{
  scroll-behavior:smooth;
}

body{
  font-family:'Inter',system-ui,Segoe UI,Roboto,Arial;
  background:#eef1f5;
  color:#1e293b;
  line-height:1.6;
}

/* ===== PAGE ===== */
.page{
  max-width:1100px;
  margin:40px auto;
  padding:40px;
  background:white;
  border-radius:14px;
  box-shadow:0 20px 40px rgba(0,0,0,.08);
}

/* ===== HEADER ===== */
.top{
  display:flex;
  justify-content:space-between;
  align-items:flex-start;
  margin-bottom:30px;
  border-bottom:2px solid #e5e7eb;
  padding-bottom:20px;
}

.brand{
  display:flex;
  gap:14px;
  align-items:center;
}

.seal{
  width:48px;
  height:48px;
  border-radius:12px;
  background:#0b3b91;
  color:white;
  display:flex;
  align-items:center;
  justify-content:center;
  font-weight:800;
  font-size:20px;
}

.brandText strong{
  display:block;
  font-size:16px;
}

.brandText span{
  font-size:13px;
  color:#64748b;
}

.docMeta{
  text-align:right;
  font-size:13px;
  color:#475569;
}

.docMeta div{
  margin-bottom:3px;
}

/* ===== TITLES ===== */
.titleRow{
  margin-bottom:30px;
}

h1{
  font-size:26px;
  font-weight:800;
  color:#0f172a;
  margin-bottom:6px;
}

.subtitle{
  color:#64748b;
  font-size:14px;
}

h2{
  font-size:20px;
  margin-bottom:14px;
  font-weight:700;
  color:#0f172a;
}

/* ===== CONTENT ===== */
.content{
  display:flex;
  flex-direction:column;
  gap:22px;
}

/* ===== CARDS ===== */
.card{
  background:#f8fafc;
  padding:24px;
  border-radius:12px;
  border:1px solid #e2e8f0;
  transition:.25s;
}

.card:hover{
  transform:translateY(-2px);
  box-shadow:0 10px 20px rgba(0,0,0,.05);
}

/* ===== LIST ===== */
.list{
  padding-left:20px;
  margin-top:10px;
}

.list li{
  margin-bottom:6px;
}

/* ===== QA ===== */
.qa p{
  margin-bottom:10px;
}

/* ===== INFO GRID ===== */
.infoGrid{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:16px;
}

.info{
  background:#f1f5f9;
  padding:16px;
  border-radius:10px;
  border:1px solid #e2e8f0;
}

.info small{
  color:#64748b;
}

.info strong{
  display:block;
  font-size:16px;
}

.mini{
  font-size:12px;
  color:#64748b;
}

/* ===== BUTTONS ===== */
.btn{
  background:#0b3b91;
  color:white;
  border:none;
  padding:10px 16px;
  border-radius:8px;
  cursor:pointer;
  font-weight:600;
  transition:.2s;
}

.btn:hover{
  transform:scale(1.03);
}

.btn--ghost{
  background:#e2e8f0;
  color:#0f172a;
}

.btn--soft{
  background:#e0e7ff;
  color:#1e3a8a;
}

.actions{
  display:flex;
  gap:10px;
}

/* ===== GROUP ===== */
.groupHead{
  display:flex;
  justify-content:space-between;
  align-items:center;
  margin-bottom:10px;
}

.pill{
  background:#0b3b91;
  color:white;
  padding:2px 8px;
  border-radius:20px;
  font-size:11px;
  margin-left:6px;
}

/* ===== SECTION TITLE ===== */
.sectionTitle{
  display:flex;
  align-items:center;
  gap:10px;
  margin-top:10px;
}

.dot{
  width:10px;
  height:10px;
  background:#0b3b91;
  border-radius:50%;
}

/* ===== FOOTER ===== */
.footer{
  margin-top:30px;
  border-top:2px solid #e5e7eb;
  padding-top:14px;
  display:flex;
  justify-content:space-between;
  font-size:13px;
  color:#64748b;
}

/* ===== TOAST ===== */
.toast{
  position:fixed;
  bottom:20px;
  left:50%;
  transform:translateX(-50%);
  background:#0b3b91;
  color:white;
  padding:10px 18px;
  border-radius:30px;
  opacity:0;
  pointer-events:none;
  transition:.3s;
}

.toast.show{
  opacity:1;
}

/* ===== PRINT ===== */
@media print{

body{
  background:white;
}

.page{
  box-shadow:none;
  margin:0;
  padding:0;
}

.no-print{
  display:none;
}

.card{
  border:none;
  background:white;
  padding:0;
}

}

/* ===== RESPONSIVO ===== */
@media(max-width:900px){

.page{
  margin:0;
  border-radius:0;
  padding:24px;
}

.top{
  flex-direction:column;
  gap:16px;
}

.docMeta{
  text-align:left;
}

.infoGrid{
  grid-template-columns:1fr;
}

.footer{
  flex-direction:column;
  gap:6px;
}

}

