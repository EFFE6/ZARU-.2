import React from 'react';

interface IconProps {
  size?: number;
  color?: string;
  className?: string;
}

// ICONOS DE LOS TABS EN GENERAL

//iconos de los tabs de gestion
export const GestionIcon: React.FC<IconProps> = ({ size = 28, color = 'currentColor', className }) => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="28" height="28" rx="14" fill="url(#paint0_linear_540_15107)" />
    <path d="M18.2547 11.3334H18.962C19.5353 11.3334 19.9993 11.7974 19.9993 12.3707V18.9634C19.9993 19.536 19.5353 20 18.962 20H11.7033C11.13 20 10.666 19.536 10.666 18.9627V18" stroke="#F1F1F1" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    <path fillRule="evenodd" clipRule="evenodd" d="M8.6674 18H16.2087C16.6547 18 17.0707 17.7773 17.3181 17.406L17.8074 16.6713C18.0994 16.2333 18.2554 15.7186 18.2554 15.192V9.99996C18.2554 9.26329 17.6587 8.66663 16.9221 8.66663H10.2554C9.51873 8.66663 8.92206 9.26329 8.92206 9.99996V14.704C8.92206 15.118 8.8254 15.526 8.64073 15.8966L8.0714 17.0353C7.8494 17.4786 8.17206 18 8.6674 18Z" stroke="#F1F1F1" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M11.5872 8V9.33333" stroke="#F1F1F1" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M15.5872 8V9.33333" stroke="#F1F1F1" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M11.4609 12H15.4609" stroke="#F1F1F1" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M11.4609 14.6667H15.4609" stroke="#F1F1F1" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    <defs>
      <linearGradient id="paint0_linear_540_15107" x1="14" y1="0" x2="14" y2="28" gradientUnits="userSpaceOnUse">
        <stop stopColor="#0165B0" />
        <stop offset="1" stopColor="#013156" />
      </linearGradient>
    </defs>
  </svg>

);



//iconos de los tabs de datos basicos 

//icono del tab funcionarios
export const FuncionariosIcon: React.FC<IconProps> = ({ size = 20, className }) => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="28" height="28" rx="14" fill="url(#paint0_linear_480_42534)" />
    <circle cx="11.2242" cy="11.5773" r="2.422" stroke="white" strokeWidth="1.63333" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="17.4703" cy="12.2643" r="1.73496" stroke="white" strokeWidth="1.63333" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M7.06055 19.551V18.8452C7.06055 17.3184 8.29792 16.0811 9.82468 16.0811H12.6242C14.151 16.0811 15.3883 17.3184 15.3883 18.8452V19.551" stroke="white" strokeWidth="1.63333" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M17.4702 16.0811H18.235C19.7617 16.0811 20.9991 17.3184 20.9991 18.8452V19.551" stroke="white" strokeWidth="1.63333" strokeLinecap="round" strokeLinejoin="round" />
    <defs>
      <linearGradient id="paint0_linear_480_42534" x1="14" y1="0" x2="14" y2="28" gradientUnits="userSpaceOnUse">
        <stop stopColor="#0165B0" />
        <stop offset="1" stopColor="#013156" />
      </linearGradient>
    </defs>
  </svg>
);


// icono del tab contratistas
export const ContratistasIcon: React.FC<IconProps> = ({ size = 20, className }) => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="28" height="28" rx="14" fill="url(#paint0_linear_480_42654)" />
    <circle cx="18.3044" cy="18.6354" r="2.31757" stroke="white" strokeWidth="0.993243" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M19.0768 18.249L18.1116 19.2147L17.5317 18.6353" stroke="white" strokeWidth="0.993243" strokeLinecap="round" strokeLinejoin="round" />
    <path fillRule="evenodd" clipRule="evenodd" d="M11.2422 11.3514H16.7583C17.124 11.3514 17.4204 11.055 17.4204 10.6893V10.1365C17.4204 9.22939 17.0601 8.35946 16.4187 7.71805C15.7773 7.07664 14.9073 6.71631 14.0003 6.71631V6.71631C13.0932 6.71631 12.2232 7.07664 11.5818 7.71805C10.9404 8.35946 10.5801 9.22939 10.5801 10.1365V10.6893C10.5801 11.055 10.8765 11.3514 11.2422 11.3514Z" stroke="white" strokeWidth="0.993243" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M10.3584 11.3516H17.6422" stroke="white" strokeWidth="0.993243" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M16.6489 11.3516V12.6756C16.6489 14.1384 15.463 15.3242 14.0002 15.3242V15.3242C12.5374 15.3242 11.3516 14.1384 11.3516 12.6756V11.3516" stroke="white" strokeWidth="0.993243" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12.6103 14.9307L12.1309 16.8485" stroke="white" strokeWidth="0.993243" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M14.9933 6.86279V7.77604C14.9933 8.32459 14.5486 8.76928 14.0001 8.76928V8.76928C13.4515 8.76928 13.0068 8.32459 13.0068 7.77604V6.86279" stroke="white" strokeWidth="0.993243" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M15.3914 14.9307L15.6555 15.9869" stroke="white" strokeWidth="0.993243" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M14.6621 17.2958C13.7284 17.4709 12.7632 17.2749 11.9716 16.7495H11.9716C11.8394 16.6614 11.6777 16.6294 11.5219 16.6606L9.63742 17.0374C8.70888 17.2232 8.04051 18.0385 8.04053 18.9854V19.2976" stroke="white" strokeWidth="0.993243" strokeLinecap="round" strokeLinejoin="round" />
    <defs>
      <linearGradient id="paint0_linear_480_42654" x1="14" y1="0" x2="14" y2="28" gradientUnits="userSpaceOnUse">
        <stop stopColor="#0165B0" />
        <stop offset="1" stopColor="#013156" />
      </linearGradient>
    </defs>
  </svg>

);





// icono del tab Medicos
export const MedicosIcon: React.FC<IconProps> = ({ size = 20, className }) => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="27.3514" height="27.3514" rx="13.6757" fill="url(#paint0_linear_480_43321)" />
    <path d="M16.3426 10.3424H11.0093" stroke="white" strokeLinecap="round" strokeLinejoin="round" />
    <path fillRule="evenodd" clipRule="evenodd" d="M12.3426 7.67566H15.0093C15.7457 7.67566 16.3426 8.27261 16.3426 9.00899V11.6757C16.3426 13.1484 15.1487 14.3423 13.6759 14.3423V14.3423C12.2032 14.3423 11.0093 13.1484 11.0093 11.6757V9.00899C11.0093 8.27261 11.6062 7.67566 12.3426 7.67566Z" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M11.7811 15.927L9.2837 16.4263C8.34879 16.6132 7.6758 17.434 7.67578 18.3875V19.6757" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M11.0091 16.0813V18.3423" stroke="white" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="11.0093" cy="19.3423" r="1" stroke="white" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M17.6756 16.8423V18.509" stroke="white" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M18.509 17.6756H16.8423" stroke="white" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="17.6759" cy="17.6757" r="2.66667" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    <defs>
      <linearGradient id="paint0_linear_480_43321" x1="13.6757" y1="0" x2="13.6757" y2="27.3514" gradientUnits="userSpaceOnUse">
        <stop stopColor="#0165B0" />
        <stop offset="1" stopColor="#013156" />
      </linearGradient>
    </defs>
  </svg>

);


// icono del tab Contratos
export const ContratosIcon: React.FC<IconProps> = ({ size = 20, className }) => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="27.3514" height="27.3514" rx="13.6757" fill="url(#paint0_linear_480_43625)" />
    <path d="M18.3426 15.6757V10.8943C18.3426 10.541 18.2019 10.2017 17.9519 9.95166L16.0666 8.06633C15.8166 7.81633 15.4773 7.67566 15.1239 7.67566H10.3426C9.60594 7.67566 9.00928 8.27233 9.00928 9.00899V18.3423C9.00928 19.079 9.60594 19.6757 10.3426 19.6757H14.3426" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M19.6756 17.6757L17.6756 19.6757L16.3423 18.3423" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M11.0093 13.009H15.0093" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M11.0093 15.009H15.0093" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M11.0093 17.009H13.8959" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M18.3426 11.009H15.6759C15.3079 11.009 15.0093 10.7103 15.0093 10.3423V7.67566" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <defs>
      <linearGradient id="paint0_linear_480_43625" x1="13.6757" y1="0" x2="13.6757" y2="27.3514" gradientUnits="userSpaceOnUse">
        <stop stopColor="#0165B0" />
        <stop offset="1" stopColor="#013156" />
      </linearGradient>
    </defs>
  </svg>

);







//iconos de datos basicos
export const MedicoIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M14.102 12.4053L14.5009 14.0009" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M13.0005 16.0661C11.5897 16.3461 10.1256 16.0487 8.93581 15.2405C8.73609 15.1076 8.49177 15.0594 8.25653 15.1065L5.40934 15.6757C4.00626 15.9562 2.99634 17.1881 2.99634 18.6189V19.0031" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M16.0019 6.99801H7.99854" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path fillRule="evenodd" clipRule="evenodd" d="M9.99937 2.99634H14.001C15.1061 2.99634 16.0019 3.89214 16.0019 4.99717V8.99884C16.0019 11.2089 14.2103 13.0005 12.0002 13.0005V13.0005C9.79014 13.0005 7.99854 11.2089 7.99854 8.99884V4.99717C7.99854 3.89214 8.89434 2.99634 9.99937 2.99634Z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M9.90018 12.4053L9.15687 15.3785" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="18.5029" cy="18.0027" r="3.50146" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M19.67 17.4192L18.2118 18.8781L17.3357 18.0027" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M7.9985 15.158V19.003" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="7.99843" cy="20.5036" r="1.50063" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const BeneficiarioCitaIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path fillRule="evenodd" clipRule="evenodd" d="M17.2261 15.1575L17 15.3871L16.7738 15.1574C16.3624 14.737 15.7989 14.5 15.2107 14.5C14.6224 14.5 14.0589 14.737 13.6475 15.1574V15.1574C12.7842 16.0395 12.7842 17.4499 13.6475 18.3319L15.7626 20.4796C16.0883 20.8124 16.5343 21 17 21C17.4657 21 17.9117 20.8124 18.2374 20.4796L20.3525 18.332C21.2158 17.4499 21.2158 16.0396 20.3525 15.1575V15.1575C19.941 14.737 19.3776 14.5 18.7893 14.5C18.201 14.5 17.6375 14.737 17.2261 15.1575Z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M10 15H7C4.79086 15 3 16.7909 3 19V20" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="11" cy="7" r="4" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const RelojIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M16.0665 12.1193H11.4146" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="12.0169" cy="11.5167" r="9.00375" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M11.4145 12.1192V6.51465" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const BeneficiariosActivosIcon: React.FC<IconProps> = ({ size = 20, className }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="13.9584" cy="14.7917" r="3.54167" stroke="url(#paint0_linear_beneficiarios)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M15.1491 14.0903L13.6616 15.5769L12.7673 14.6853" stroke="url(#paint1_linear_beneficiarios)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8.33333 12.5H5.83333C3.99238 12.5 2.5 13.9924 2.5 15.8333V16.6667" stroke="url(#paint2_linear_beneficiarios)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="9.16658" cy="5.83333" r="3.33333" stroke="url(#paint3_linear_beneficiarios)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    <defs>
      <linearGradient id="paint0_linear_beneficiarios" x1="13.9584" y1="11.25" x2="13.9584" y2="18.3333" gradientUnits="userSpaceOnUse">
        <stop stopColor="#2A5267" />
        <stop offset="1" stopColor="#3D7794" />
      </linearGradient>
      <linearGradient id="paint1_linear_beneficiarios" x1="13.9582" y1="14.0903" x2="13.9582" y2="15.5769" gradientUnits="userSpaceOnUse">
        <stop stopColor="#2A5267" />
        <stop offset="1" stopColor="#3D7794" />
      </linearGradient>
      <linearGradient id="paint2_linear_beneficiarios" x1="5.41667" y1="12.5" x2="5.41667" y2="16.6667" gradientUnits="userSpaceOnUse">
        <stop stopColor="#2A5267" />
        <stop offset="1" stopColor="#3D7794" />
      </linearGradient>
      <linearGradient id="paint3_linear_beneficiarios" x1="9.16659" y1="2.5" x2="9.16659" y2="9.16667" gradientUnits="userSpaceOnUse">
        <stop stopColor="#2A5267" />
        <stop offset="1" stopColor="#3D7794" />
      </linearGradient>
    </defs>
  </svg>
);

export const CitasProgramadasIcon2: React.FC<IconProps> = ({ size = 20, className }) => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8.14218 2.94995H8.67268C9.10268 2.94995 9.45068 3.29795 9.45068 3.72795V8.67245C9.45068 9.10195 9.10268 9.44995 8.67268 9.44995H3.22868C2.79868 9.44995 2.45068 9.10195 2.45068 8.67195V7.94995" stroke="white" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round" />
    <path fillRule="evenodd" clipRule="evenodd" d="M0.95123 7.94995H6.60723C6.94173 7.94995 7.25373 7.78295 7.43923 7.50445L7.80623 6.95345C8.02523 6.62495 8.14223 6.23895 8.14223 5.84395V1.94995C8.14223 1.39745 7.69473 0.949951 7.14223 0.949951H2.14223C1.58973 0.949951 1.14223 1.39745 1.14223 1.94995V5.47795C1.14223 5.78845 1.06973 6.09445 0.93123 6.37245L0.50423 7.22645C0.33773 7.55895 0.57973 7.94995 0.95123 7.94995Z" stroke="white" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M3.14062 0.449951V1.44995" stroke="white" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M6.14062 0.449951V1.44995" stroke="white" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M3.04565 3.44995H6.04565" stroke="white" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M3.04565 5.44995H6.04565" stroke="white" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round" />
  </svg>

);

export const CitasProgramadasIcon: React.FC<IconProps> = ({ size = 20, className }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M15.3193 6.66675H16.2035C16.9202 6.66675 17.5002 7.24675 17.5002 7.96341V16.2042C17.5002 16.9201 16.9202 17.5001 16.2035 17.5001H7.13016C6.4135 17.5001 5.8335 16.9201 5.8335 16.2034V15.0001" stroke="url(#paint0_linear_citas)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    <path fillRule="evenodd" clipRule="evenodd" d="M3.33424 15.0002H12.7609C13.3184 15.0002 13.8384 14.7218 14.1476 14.2577L14.7592 13.3393C15.1242 12.7918 15.3192 12.1485 15.3192 11.4902V5.00016C15.3192 4.07933 14.5734 3.3335 13.6526 3.3335H5.31924C4.39841 3.3335 3.65258 4.07933 3.65258 5.00016V10.8802C3.65258 11.3977 3.53174 11.9077 3.30091 12.371L2.58924 13.7943C2.31174 14.3485 2.71508 15.0002 3.33424 15.0002Z" stroke="url(#paint1_linear_citas)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M6.98332 2.5V4.16667" stroke="url(#paint2_linear_citas)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M11.9833 2.5V4.16667" stroke="url(#paint3_linear_citas)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M6.82495 7.50016H11.825" stroke="url(#paint4_linear_citas)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M6.82495 10.8334H11.825" stroke="url(#paint5_linear_citas)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    <defs>
      <linearGradient id="paint0_linear_citas" x1="11.6668" y1="6.66675" x2="11.6668" y2="17.5001" gradientUnits="userSpaceOnUse">
        <stop stopColor="#2A5267" />
        <stop offset="1" stopColor="#3D7794" />
      </linearGradient>
      <linearGradient id="paint1_linear_citas" x1="8.90962" y1="3.3335" x2="8.90962" y2="15.0002" gradientUnits="userSpaceOnUse">
        <stop stopColor="#2A5267" />
        <stop offset="1" stopColor="#3D7794" />
      </linearGradient>
      <linearGradient id="paint2_linear_citas" x1="6.98332" y1="2.5" x2="6.98332" y2="4.16667" gradientUnits="userSpaceOnUse">
        <stop stopColor="#2A5267" />
        <stop offset="1" stopColor="#3D7794" />
      </linearGradient>
      <linearGradient id="paint3_linear_citas" x1="11.9833" y1="2.5" x2="11.9833" y2="4.16667" gradientUnits="userSpaceOnUse">
        <stop stopColor="#2A5267" />
        <stop offset="1" stopColor="#3D7794" />
      </linearGradient>
      <linearGradient id="paint4_linear_citas" x1="9.32495" y1="7.0835" x2="9.32495" y2="7.91683" gradientUnits="userSpaceOnUse">
        <stop stopColor="#2A5267" />
        <stop offset="1" stopColor="#3D7794" />
      </linearGradient>
      <linearGradient id="paint5_linear_citas" x1="9.32495" y1="10.4167" x2="9.32495" y2="11.2501" gradientUnits="userSpaceOnUse">
        <stop stopColor="#2A5267" />
        <stop offset="1" stopColor="#3D7794" />
      </linearGradient>
    </defs>
  </svg>
);

export const OrdenesMedicasIcon: React.FC<IconProps> = ({ size = 20, className }) => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M17.4999 13.4999C17.4999 13.1317 17.2014 12.8333 16.8333 12.8333H15.4999V11.4999C15.4999 11.1317 15.2014 10.8333 14.8333 10.8333H13.4999C13.1317 10.8333 12.8333 11.1317 12.8333 11.4999V12.8333H11.4999C11.1317 12.8333 10.8333 13.1317 10.8333 13.4999V14.8333C10.8333 15.2014 11.1317 15.4999 11.4999 15.4999H12.8333V16.8333C12.8333 17.2014 13.1317 17.4999 13.4999 17.4999H14.8333C15.2014 17.4999 15.4999 17.2014 15.4999 16.8333V15.4999H16.8333C17.2014 15.4999 17.4999 15.2014 17.4999 14.8333V13.4999Z" stroke="url(#paint0_linear_1_5717)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M5.83325 6.66667H13.3333" stroke="url(#paint1_linear_1_5717)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M5.83325 9.99992H9.99992" stroke="url(#paint2_linear_1_5717)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M5.83325 13.3334H7.49992" stroke="url(#paint3_linear_1_5717)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M16.6667 8.33333V5C16.6667 3.61929 15.5474 2.5 14.1667 2.5H5C3.61929 2.5 2.5 3.61929 2.5 5V15C2.5 16.3807 3.61929 17.5 5 17.5H8.33333" stroke="url(#paint4_linear_1_5717)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <defs>
      <linearGradient id="paint0_linear_1_5717" x1="14.1666" y1="10.8333" x2="14.1666" y2="17.4999" gradientUnits="userSpaceOnUse">
        <stop stopColor="#2A5267" />
        <stop offset="1" stopColor="#3D7794" />
      </linearGradient>
      <linearGradient id="paint1_linear_1_5717" x1="9.58325" y1="6.25" x2="9.58325" y2="7.08333" gradientUnits="userSpaceOnUse">
        <stop stopColor="#2A5267" />
        <stop offset="1" stopColor="#3D7794" />
      </linearGradient>
      <linearGradient id="paint2_linear_1_5717" x1="7.91659" y1="9.58325" x2="7.91659" y2="10.4166" gradientUnits="userSpaceOnUse">
        <stop stopColor="#2A5267" />
        <stop offset="1" stopColor="#3D7794" />
      </linearGradient>
      <linearGradient id="paint3_linear_1_5717" x1="6.66659" y1="12.9167" x2="6.66659" y2="13.7501" gradientUnits="userSpaceOnUse">
        <stop stopColor="#2A5267" />
        <stop offset="1" stopColor="#3D7794" />
      </linearGradient>
      <linearGradient id="paint4_linear_1_5717" x1="9.58333" y1="2.5" x2="9.58333" y2="17.5" gradientUnits="userSpaceOnUse">
        <stop stopColor="#2A5267" />
        <stop offset="1" stopColor="#3D7794" />
      </linearGradient>
    </defs>
  </svg>

);

export const ProfesionalesIcon: React.FC<IconProps> = ({ size = 20, className }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="3.33325" y="2.5" width="13.3333" height="15" rx="2" stroke="url(#paint0_linear_profesionales)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M6.66675 14.1667H13.3334" stroke="url(#paint1_linear_profesionales)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path fillRule="evenodd" clipRule="evenodd" d="M9.34607 5.82327C9.46889 5.57435 9.72239 5.41675 9.99997 5.41675C10.2775 5.41675 10.531 5.57435 10.6539 5.82327L11.0249 6.57534C11.131 6.79059 11.3364 6.9398 11.5739 6.97432L12.4038 7.09495C12.6784 7.13488 12.9065 7.32721 12.9923 7.5911C13.0781 7.85498 13.0066 8.14469 12.808 8.33845L12.2073 8.92442C12.0355 9.09194 11.9572 9.33321 11.9977 9.56966L12.1395 10.396C12.1864 10.6695 12.0739 10.946 11.8494 11.1091C11.6249 11.2722 11.3273 11.2938 11.0816 11.1647L10.3392 10.7745C10.1268 10.6629 9.87313 10.6629 9.66075 10.7745L8.91831 11.1647C8.67265 11.2938 8.37501 11.2722 8.15051 11.1091C7.92601 10.946 7.81357 10.6695 7.86046 10.396L8.00222 9.56966C8.04277 9.33321 7.96442 9.09194 7.79269 8.92442L7.19193 8.33845C6.99331 8.14469 6.92188 7.85498 7.00766 7.5911C7.09345 7.32721 7.32157 7.13488 7.59616 7.09495L8.42605 6.97432C8.66358 6.9398 8.8689 6.79059 8.97508 6.57534L9.34607 5.82327Z" stroke="url(#paint2_linear_profesionales)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <defs>
      <linearGradient id="paint0_linear_profesionales" x1="9.99992" y1="2.5" x2="9.99992" y2="17.5" gradientUnits="userSpaceOnUse">
        <stop stopColor="#2A5267" />
        <stop offset="1" stopColor="#3D7794" />
      </linearGradient>
      <linearGradient id="paint1_linear_profesionales" x1="10.0001" y1="13.75" x2="10.0001" y2="14.5833" gradientUnits="userSpaceOnUse">
        <stop stopColor="#2A5267" />
        <stop offset="1" stopColor="#3D7794" />
      </linearGradient>
      <linearGradient id="paint2_linear_profesionales" x1="9.99997" y1="5.41675" x2="9.99997" y2="11.2484" gradientUnits="userSpaceOnUse">
        <stop stopColor="#2A5267" />
        <stop offset="1" stopColor="#3D7794" />
      </linearGradient>
    </defs>
  </svg>
);



export const CargosIcon: React.FC<IconProps> = ({ size = 20, className }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9.33317 3.33301H11.9998C12.7365 3.33301 13.3332 3.92967 13.3332 4.66634V13.333C13.3332 14.0697 12.7365 14.6663 11.9998 14.6663H3.99984C3.26317 14.6663 2.6665 14.0697 2.6665 13.333V4.66634C2.6665 3.92967 3.26317 3.33301 3.99984 3.33301H6.6665" stroke="#5535A0" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M9.06066 7.10633C9.64645 7.69212 9.64645 8.64187 9.06066 9.22765C8.47487 9.81344 7.52513 9.81344 6.93934 9.22765C6.35355 8.64187 6.35355 7.69212 6.93934 7.10633C7.52513 6.52055 8.47487 6.52055 9.06066 7.10633" stroke="#5535A0" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M10.3968 12.6663C10.2802 12.3737 10.1002 12.111 9.86885 11.897V11.897C9.47752 11.5343 8.96418 11.333 8.43085 11.333H7.56952C7.03618 11.333 6.52285 11.5343 6.13152 11.897V11.897C5.90018 12.111 5.72018 12.3737 5.60352 12.6663" stroke="#5535A0" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    <path fillRule="evenodd" clipRule="evenodd" d="M8.6665 4.66634H7.33317C6.96517 4.66634 6.6665 4.36767 6.6665 3.99967V1.99967C6.6665 1.63167 6.96517 1.33301 7.33317 1.33301H8.6665C9.0345 1.33301 9.33317 1.63167 9.33317 1.99967V3.99967C9.33317 4.36767 9.0345 4.66634 8.6665 4.66634Z" stroke="#5535A0" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>

);


export const EditarFuncionarioIcon: React.FC<IconProps> = ({ size = 20, className }) => (
  <svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M15.9358 7.91722L12.1895 4.1709" stroke="url(#paint0_linear_540_24015)" strokeWidth="2.10566" strokeLinecap="round" strokeLinejoin="round" />
    <path fillRule="evenodd" clipRule="evenodd" d="M4.38041 19.0538H1.05273V15.7261C1.05273 15.4548 1.16021 15.1938 1.35264 15.0024L15.0011 1.3529C15.4013 0.952679 16.0493 0.952679 16.4485 1.3529L18.7526 3.65699C19.1528 4.05721 19.1528 4.70514 18.7526 5.10434L5.10408 18.7538C4.91267 18.9463 4.65166 19.0538 4.38041 19.0538V19.0538Z" stroke="url(#paint1_linear_540_24015)" strokeWidth="2.10566" strokeLinecap="round" strokeLinejoin="round" />
    <defs>
      <linearGradient id="paint0_linear_540_24015" x1="19.9162" y1="-0.0827327" x2="8.58939" y2="0.509521" gradientUnits="userSpaceOnUse">
        <stop stopColor="#0165B0" />
        <stop offset="1" stopColor="#013156" />
      </linearGradient>
      <linearGradient id="paint1_linear_540_24015" x1="38.1777" y1="-19.3859" x2="-16.2446" y2="-16.5405" gradientUnits="userSpaceOnUse">
        <stop stopColor="#0165B0" />
        <stop offset="1" stopColor="#013156" />
      </linearGradient>
    </defs>
  </svg>

);


export const EditarBeneficiariosIcon: React.FC<IconProps> = ({ size = 20, className }) => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="0.7" y="0.7" width="26.6" height="26.6" rx="7.3" stroke="url(#paint0_linear_540_25399)" stroke-width="1.4" />
    <path d="M17.3528 12.7829L15.2178 10.6479" stroke="url(#paint1_linear_540_25399)" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" />
    <path fill-rule="evenodd" clip-rule="evenodd" d="M10.7675 19.1293H8.87109V17.2328C8.87109 17.0783 8.93234 16.9295 9.04201 16.8204L16.8202 9.04167C17.0483 8.81358 17.4175 8.81358 17.645 9.04167L18.9581 10.3548C19.1862 10.5828 19.1862 10.9521 18.9581 11.1796L11.1799 18.9583C11.0708 19.068 10.9221 19.1293 10.7675 19.1293V19.1293Z" stroke="url(#paint2_linear_540_25399)" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" />
    <defs>
      <linearGradient id="paint0_linear_540_25399" x1="57.75" y1="-31.7916" x2="-26.9069" y2="-27.3651" gradientUnits="userSpaceOnUse">
        <stop stop-color="#0165B0" />
        <stop offset="1" stop-color="#013156" />
      </linearGradient>
      <linearGradient id="paint1_linear_540_25399" x1="19.6212" y1="8.22384" x2="13.1661" y2="8.56136" gradientUnits="userSpaceOnUse">
        <stop stop-color="#0165B0" />
        <stop offset="1" stop-color="#013156" />
      </linearGradient>
      <linearGradient id="paint2_linear_540_25399" x1="30.0283" y1="-2.77722" x2="-0.986509" y2="-1.15562" gradientUnits="userSpaceOnUse">
        <stop stop-color="#0165B0" />
        <stop offset="1" stop-color="#013156" />
      </linearGradient>
    </defs>
  </svg>
);

export const EliminarBeneficiariosIcon: React.FC<IconProps> = ({ size = 20, className }) => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="0.7" y="0.7" width="26.6" height="26.6" rx="7.3" stroke="url(#paint0_linear_540_25408)" stroke-width="1.4" />
    <path d="M18 10.167V18.667C18 19.4957 17.3153 20.167 16.4873 20.167H11.4873C10.6587 20.167 10 19.4957 10 18.667V10.167" stroke="url(#paint1_linear_540_25408)" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M19 10.1668H9" stroke="url(#paint2_linear_540_25408)" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M12.667 8.16683H15.3337" stroke="url(#paint3_linear_540_25408)" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M15.3333 12.8335V17.5002" stroke="url(#paint4_linear_540_25408)" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M12.6663 17.5002V12.8335" stroke="url(#paint5_linear_540_25408)" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" />
    <defs>
      <linearGradient id="paint0_linear_540_25408" x1="57.75" y1="-31.7916" x2="-26.9069" y2="-27.3651" gradientUnits="userSpaceOnUse">
        <stop stop-color="#0165B0" />
        <stop offset="1" stop-color="#013156" />
      </linearGradient>
      <linearGradient id="paint1_linear_540_25408" x1="26.5" y1="-1.18716" x2="2.28855" y2="-0.174396" gradientUnits="userSpaceOnUse">
        <stop stop-color="#0165B0" />
        <stop offset="1" stop-color="#013156" />
      </linearGradient>
      <linearGradient id="paint2_linear_540_25408" x1="29.625" y1="9.07655" x2="10.8544" y2="23.7986" gradientUnits="userSpaceOnUse">
        <stop stop-color="#0165B0" />
        <stop offset="1" stop-color="#013156" />
      </linearGradient>
      <linearGradient id="paint3_linear_540_25408" x1="18.167" y1="7.07655" x2="10.4212" y2="8.69658" gradientUnits="userSpaceOnUse">
        <stop stop-color="#0165B0" />
        <stop offset="1" stop-color="#013156" />
      </linearGradient>
      <linearGradient id="paint4_linear_540_25408" x1="16.375" y1="7.53489" x2="14.354" y2="7.54999" gradientUnits="userSpaceOnUse">
        <stop stop-color="#0165B0" />
        <stop offset="1" stop-color="#013156" />
      </linearGradient>
      <linearGradient id="paint5_linear_540_25408" x1="13.708" y1="7.53489" x2="11.687" y2="7.54999" gradientUnits="userSpaceOnUse">
        <stop stop-color="#0165B0" />
        <stop offset="1" stop-color="#013156" />
      </linearGradient>
    </defs>
  </svg>


);