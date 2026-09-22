export const plantillaCorporativaHTML = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,400;0,600;0,700;1,400&family=Lato:wght@400;700&display=swap" rel="stylesheet" />
  <title>CV</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Poppins', sans-serif; background: #ffffff; }

    .page {
      width: 595.5px;
      min-height: 842.25px;
      display: flex;
      overflow: hidden;
    }

    /* ─── SIDEBAR ─── */
    .sidebar {
      width: 257px;
      min-height: 842.25px;
      background: #444444;
      color: #ffffff;
      padding: 28px 16px 24px;
      display: flex;
      flex-direction: column;
      gap: 0;
    }
    .photo-wrapper {
      display: flex;
      justify-content: center;
      margin-bottom: 12px;
    }
    .photo-border {
      width: 88px;
      height: 88px;
      border-radius: 50%;
      border: 2.5px solid rgba(255,255,255,0.5);
      padding: 3px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .photo-border img {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      object-fit: cover;
    }
    .name-block {
      text-align: center;
      margin-bottom: 14px;
    }
    .name-block .name {
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.6px;
      text-transform: uppercase;
      line-height: 1.2;
    }
    .name-block .profession {
      font-size: 9px;
      font-weight: 400;
      color: #cccccc;
      margin-top: 3px;
      letter-spacing: 0.3px;
    }
    .sidebar-divider {
      border: none;
      border-top: 0.5px solid rgba(255,255,255,0.2);
      margin: 10px 0;
    }
    .sidebar-section-title {
      font-size: 7.5px;
      font-weight: 700;
      letter-spacing: 1.8px;
      text-transform: uppercase;
      color: #ffffff;
      margin-bottom: 8px;
    }
    .contact-list {
      display: flex;
      flex-direction: column;
      gap: 5px;
      margin-bottom: 2px;
    }
    .contact-item {
      display: flex;
      align-items: flex-start;
      gap: 6px;
      font-size: 7.5px;
      color: #dddddd;
      line-height: 1.35;
    }
    .contact-item svg {
      flex-shrink: 0;
      margin-top: 1px;
      fill: #aaaaaa;
    }
    .edu-list {
      display: flex;
      flex-direction: column;
      gap: 9px;
      margin-bottom: 2px;
    }
    .edu-institution {
      font-size: 8px;
      font-weight: 600;
      color: #ffffff;
      line-height: 1.2;
    }
    .edu-degree {
      font-size: 7.5px;
      font-weight: 400;
      color: #cccccc;
      font-style: italic;
      line-height: 1.25;
    }
    .edu-dates {
      font-size: 7px;
      color: #aaaaaa;
      margin-top: 1px;
    }
    .skills-list, .lang-list {
      display: flex;
      flex-direction: column;
      gap: 4px;
      margin-bottom: 2px;
    }
    .skill-item, .lang-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 7.5px;
      color: #dddddd;
    }
    .dot {
      width: 4px;
      height: 4px;
      background: #aaaaaa;
      border-radius: 50%;
      flex-shrink: 0;
    }

    /* ─── CONTENT ─── */
    .content {
      flex: 1;
      min-height: 842.25px;
      background: #ffffff;
      padding: 28px 18px 24px;
      display: flex;
      flex-direction: column;
      gap: 0;
    }
    .content-section-title {
      font-size: 7.5px;
      font-weight: 700;
      letter-spacing: 1.8px;
      text-transform: uppercase;
      color: #444444;
      border-bottom: 0.75px solid #444444;
      padding-bottom: 3px;
      margin-bottom: 9px;
    }
    .profile-text {
      font-size: 7.5px;
      color: #555555;
      line-height: 1.55;
      margin-bottom: 14px;
    }
    .exp-list {
      display: flex;
      flex-direction: column;
      gap: 11px;
      margin-bottom: 14px;
    }
    .exp-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1px;
    }
    .exp-company {
      font-size: 8px;
      font-weight: 700;
      color: #333333;
      line-height: 1.2;
    }
    .exp-dates {
      font-size: 7px;
      color: #888888;
      white-space: nowrap;
      margin-left: 4px;
    }
    .exp-role {
      font-size: 7.5px;
      font-weight: 600;
      color: #555555;
      font-style: italic;
      margin-bottom: 4px;
    }
    .exp-bullets {
      display: flex;
      flex-direction: column;
      gap: 2px;
      padding-left: 2px;
    }
    .exp-bullet {
      font-size: 7px;
      color: #666666;
      line-height: 1.4;
      display: flex;
      gap: 5px;
    }
    .exp-bullet::before {
      content: '•';
      color: #888888;
      flex-shrink: 0;
    }
    .ref-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .ref-name {
      font-size: 8px;
      font-weight: 700;
      color: #333333;
    }
    .ref-role {
      font-size: 7.5px;
      color: #555555;
    }
    .ref-contact {
      font-size: 7px;
      color: #888888;
    }
  </style>
</head>
<body>
<div class="page">

  <!-- ═══ SIDEBAR ═══ -->
  <div class="sidebar">

    <div class="photo-wrapper">
      <div class="photo-border">
        <img src="USUARIO_FOTO" alt="" />
      </div>
    </div>

    <div class="name-block">
      <div class="name">USUARIO_NOMBRE USUARIO_APELLIDO</div>
      <div class="profession">USUARIO_PROFESION</div>
    </div>

    <hr class="sidebar-divider" />

    <div class="sidebar-section-title">Contact</div>
    <div class="contact-list">
      <div class="contact-item">
        <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
        <span>USUARIO_TELEFONO</span>
      </div>
      <div class="contact-item">
        <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
        <span>USUARIO_EMAIL</span>
      </div>
      <div class="contact-item">
        <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
        <span>USUARIO_CIUDAD, USUARIO_PAIS</span>
      </div>
    </div>

    <hr class="sidebar-divider" />

    <div class="sidebar-section-title">Education</div>
    <div class="edu-list">
      <div>
        <div class="edu-institution">USUARIO_EDU1_INSTITUCION</div>
        <div class="edu-degree">USUARIO_EDU1_TITULO</div>
        <div class="edu-dates">USUARIO_EDU1_FECHAS</div>
      </div>
      <div>
        <div class="edu-institution">USUARIO_EDU2_INSTITUCION</div>
        <div class="edu-degree">USUARIO_EDU2_TITULO</div>
        <div class="edu-dates">USUARIO_EDU2_FECHAS</div>
      </div>
    </div>

    <hr class="sidebar-divider" />

    <div class="sidebar-section-title">Skills</div>
    <div class="skills-list">
      <div class="skill-item"><span class="dot"></span>USUARIO_HABILIDAD_1</div>
      <div class="skill-item"><span class="dot"></span>USUARIO_HABILIDAD_2</div>
      <div class="skill-item"><span class="dot"></span>USUARIO_HABILIDAD_3</div>
      <div class="skill-item"><span class="dot"></span>USUARIO_HABILIDAD_4</div>
      <div class="skill-item"><span class="dot"></span>USUARIO_HABILIDAD_5</div>
      <div class="skill-item"><span class="dot"></span>USUARIO_HABILIDAD_6</div>
    </div>

    <hr class="sidebar-divider" />

    <div class="sidebar-section-title">Languages</div>
    <div class="lang-list">
      <div class="lang-item"><span class="dot"></span>USUARIO_IDIOMA_1</div>
      <div class="lang-item"><span class="dot"></span>USUARIO_IDIOMA_2</div>
    </div>

  </div>

  <!-- ═══ CONTENT ═══ -->
  <div class="content">

    <div class="content-section-title">Profile</div>
    <p class="profile-text">USUARIO_RESUMEN</p>

    <div class="content-section-title">Experience</div>
    <div class="exp-list">

      <div>
        <div class="exp-header">
          <span class="exp-company">USUARIO_EXP1_EMPRESA</span>
          <span class="exp-dates">USUARIO_EXP1_FECHAS &ndash; USUARIO_EXP1_FECHA_FIN</span>
        </div>
        <div class="exp-role">USUARIO_EXP1_CARGO</div>
        <div class="exp-bullets">
          <div class="exp-bullet">USUARIO_EXP1_DESC1</div>
          <div class="exp-bullet">USUARIO_EXP1_DESC2</div>
          <div class="exp-bullet">USUARIO_EXP1_DESC3</div>
          <div class="exp-bullet">USUARIO_EXP1_DESC4</div>
          <div class="exp-bullet">USUARIO_EXP1_DESC5</div>
        </div>
      </div>

      <div>
        <div class="exp-header">
          <span class="exp-company">USUARIO_EXP2_EMPRESA</span>
          <span class="exp-dates">USUARIO_EXP2_FECHAS &ndash; USUARIO_EXP2_FECHA_FIN</span>
        </div>
        <div class="exp-role">USUARIO_EXP2_CARGO</div>
        <div class="exp-bullets">
          <div class="exp-bullet">USUARIO_EXP2_DESC1</div>
          <div class="exp-bullet">USUARIO_EXP2_DESC2</div>
          <div class="exp-bullet">USUARIO_EXP2_DESC3</div>
          <div class="exp-bullet">USUARIO_EXP2_DESC4</div>
          <div class="exp-bullet">USUARIO_EXP2_DESC5</div>
        </div>
      </div>

      <div>
        <div class="exp-header">
          <span class="exp-company">USUARIO_EXP3_EMPRESA</span>
          <span class="exp-dates">USUARIO_EXP3_FECHAS &ndash; USUARIO_EXP3_FECHA_FIN</span>
        </div>
        <div class="exp-role">USUARIO_EXP3_CARGO</div>
        <div class="exp-bullets">
          <div class="exp-bullet">USUARIO_EXP3_DESC1</div>
          <div class="exp-bullet">USUARIO_EXP3_DESC2</div>
          <div class="exp-bullet">USUARIO_EXP3_DESC3</div>
          <div class="exp-bullet">USUARIO_EXP3_DESC4</div>
          <div class="exp-bullet">USUARIO_EXP3_DESC5</div>
        </div>
      </div>

    </div>

    <div class="content-section-title">References</div>
    <div class="ref-list">
      <div>
        <div class="ref-name">USUARIO_REF1_NOMBRE</div>
        <div class="ref-role">USUARIO_REF1_CARGO</div>
        <div class="ref-contact">USUARIO_REF1_CONTACTO</div>
      </div>
    </div>

  </div>

</div>
</body>
</html>`