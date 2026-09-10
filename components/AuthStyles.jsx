export default function AuthStyles() {
  return (
    <style jsx global>{`
      .authModern {
        min-height: calc(100vh - 74px);
        padding: 56px 20px;
        background: linear-gradient(135deg, #f4f7fc 0%, #ffffff 55%, #eef3ff 100%);
      }
      .authShell {
        width: min(100%, 980px);
        display: grid;
        grid-template-columns: 1fr 440px;
        gap: 56px;
        align-items: center;
      }
      .authIntro { padding: 20px 0; }
      .authIntro h1 {
        margin: 14px 0;
        font-size: clamp(34px, 4vw, 50px);
        line-height: 1.08;
        letter-spacing: -.04em;
        color: #182a52;
      }
      .authIntro > p {
        max-width: 520px;
        color: #687386;
        font-size: 16px;
        line-height: 1.75;
      }
      .authTrust, .authChecklist {
        display: grid;
        gap: 12px;
        margin-top: 24px;
        color: #526074;
        font-size: 13px;
      }
      .authTrust span, .authChecklist span {
        display: flex;
        align-items: center;
        gap: 9px;
      }
      .authTrust svg, .authChecklist svg { color: #4169b0; flex: 0 0 auto; }
      .authCardModern {
        width: 100%;
        padding: 32px;
        border-radius: 22px;
        box-shadow: 0 22px 65px rgba(24, 42, 82, .12);
      }
      .authCardModern h2 { margin: 0 0 7px; font-size: 25px; color: #182a52; }
      .authSubtitle { margin: 0 !important; font-size: 13px; }
      .authCardModern form { gap: 16px; }
      .authInput {
        min-height: 46px;
        display: flex;
        align-items: center;
        gap: 9px;
        padding: 0 12px;
        background: #fff;
        border: 1px solid #dce2ea;
        border-radius: 10px;
        transition: border-color .2s, box-shadow .2s;
      }
      .authInput:focus-within {
        border-color: #4169b0;
        box-shadow: 0 0 0 3px rgba(65, 105, 176, .1);
      }
      .authInput > svg { color: #8792a3; flex: 0 0 auto; }
      .authInput input {
        width: 100%;
        min-width: 0;
        padding: 12px 0 !important;
        border: 0 !important;
        background: transparent;
      }
      .authInput input:focus { outline: 0; }
      .passwordToggle {
        border: 0;
        background: transparent;
        color: #667386;
        display: grid;
        place-items: center;
        padding: 5px;
        cursor: pointer;
      }
      .passwordToggle:hover { color: #182a52; }
      .optional { color: #929baa; font-weight: 500; }
      .authMessage {
        display: flex;
        align-items: flex-start;
        gap: 8px;
      }
      .authSubmit { min-height: 46px; margin-top: 2px; }
      .authSubmit:disabled { opacity: .7; cursor: not-allowed; }
      .spin { animation: authSpin 1s linear infinite; }
      @keyframes authSpin { to { transform: rotate(360deg); } }
      .authDivider {
        display: flex;
        align-items: center;
        gap: 12px;
        margin: 22px 0 14px;
        color: #98a0ad;
        font-size: 11px;
      }
      .authDivider::before, .authDivider::after {
        content: "";
        height: 1px;
        background: #e6eaf0;
        flex: 1;
      }
      .authRegisterLink { width: 100%; min-height: 44px; }
      @media (max-width: 800px) {
        .authModern { padding: 42px 18px; }
        .authShell { grid-template-columns: 1fr; gap: 24px; max-width: 520px; }
        .authIntro { text-align: center; padding: 0; }
        .authIntro > p { margin-left: auto; margin-right: auto; }
        .authTrust, .authChecklist { justify-items: center; }
        .authCardModern { padding: 26px 22px; }
      }
      @media (max-width: 520px) {
        .authModern { padding: 30px 14px; }
        .authIntro h1 { font-size: 32px; }
        .authCardModern { border-radius: 18px; padding: 22px 18px; }
      }
    `}</style>
  )
}
