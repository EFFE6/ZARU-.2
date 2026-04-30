import React from 'react';

interface IconProps {
  size?: number;
  color?: string;
  className?: string;
}

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

export const Roles: React.FC<IconProps> = ({ size = 28, className }) => (
  <svg width={size} height={size} viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect width="28" height="28" rx="14" fill="url(#paint0_linear_480_46032)" />
    <circle cx="11.2238" cy="11.5773" r="2.422" stroke="white" strokeWidth="1.63333" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="17.4693" cy="12.2643" r="1.73496" stroke="white" strokeWidth="1.63333" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M7.05957 19.551V18.8452C7.05957 17.3184 8.29694 16.0811 9.8237 16.0811H12.6232C14.15 16.0811 15.3874 17.3184 15.3874 18.8452V19.551" stroke="white" strokeWidth="1.63333" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M17.4697 16.0811H18.2345C19.7613 16.0811 20.9986 17.3184 20.9986 18.8452V19.551" stroke="white" strokeWidth="1.63333" strokeLinecap="round" strokeLinejoin="round" />
    <defs>
      <linearGradient id="paint0_linear_480_46032" x1="14" y1="0" x2="14" y2="28" gradientUnits="userSpaceOnUse">
        <stop stopColor="#0165B0" />
        <stop offset="1" stopColor="#013156" />
      </linearGradient>
    </defs>
  </svg>
);

export const Permisos: React.FC<IconProps> = ({ size = 28, className }) => (
  <svg width={size} height={size} viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect width="27.3514" height="27.3514" rx="13.6757" fill="url(#paint0_linear_480_46532)" />
    <g clipPath="url(#clip0_480_46532)">
      <path d="M16.6559 14.9179C18.9869 14.9179 20.8766 13.0283 20.8766 10.6973C20.8766 8.36623 18.9869 6.47656 16.6559 6.47656C14.3249 6.47656 12.4352 8.36623 12.4352 10.6973C12.4352 11.0052 12.4682 11.3055 12.5308 11.5947L6.47656 17.649V20.8766H9.70415L10.449 20.1317V18.3938H12.1869L13.4283 17.1524V15.4145H15.1662L15.7584 14.8223C16.0476 14.885 16.3479 14.9179 16.6559 14.9179Z" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18.1435 9.70358C18.1435 9.97782 17.9211 10.2001 17.6469 10.2001C17.3727 10.2001 17.1504 9.97782 17.1504 9.70358C17.1504 9.42935 17.3727 9.20703 17.6469 9.20703C17.9211 9.20703 18.1435 9.42935 18.1435 9.70358Z" stroke="white" strokeWidth="1.4" />
    </g>
    <defs>
      <linearGradient id="paint0_linear_480_46532" x1="13.6757" y1="0" x2="13.6757" y2="27.3514" gradientUnits="userSpaceOnUse">
        <stop stopColor="#0165B0" />
        <stop offset="1" stopColor="#013156" />
      </linearGradient>
      <clipPath id="clip0_480_46532">
        <rect width="16" height="16" fill="white" transform="translate(5.67578 5.67578)" />
      </clipPath>
    </defs>
  </svg>
);

export const Usuarios: React.FC<IconProps> = ({ size = 28, className }) => (
  <svg width={size} height={size} viewBox="0 0 47 47" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect width="47" height="47" rx="12" fill="url(#paint0_linear_538_26385)" />
    <g clipPath="url(#clip0_538_26385)">
      <path d="M23.4996 15.8711L15.8693 19.2916C15.8693 19.2916 15.0799 31.1318 23.4996 31.1318C31.9193 31.1318 31.1299 19.2916 31.1299 19.2916L23.4996 15.8711Z" stroke="#EBF6E6" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21.1328 24.2902L22.4484 25.8689L25.8689 21.1328" stroke="#EBF6E6" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </g>
    <defs>
      <linearGradient id="paint0_linear_538_26385" x1="96.9375" y1="-53.3645" x2="-45.1651" y2="-45.9343" gradientUnits="userSpaceOnUse">
        <stop stopColor="#0165B0" />
        <stop offset="1" stopColor="#013156" />
      </linearGradient>
      <clipPath id="clip0_538_26385">
        <rect width="18" height="18" fill="white" transform="translate(14.5 14.5)" />
      </clipPath>
    </defs>
  </svg>
);

export const AbrirRol: React.FC<IconProps> = ({ size = 14, className }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M9.36621 0.700195H12.6995V4.03353" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8.03418 5.36686L12.7008 0.700195" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M11.3669 8.03223V11.3656C11.3669 12.1022 10.7702 12.6989 10.0335 12.6989H2.03353C1.29686 12.6989 0.700195 12.1022 0.700195 11.3656V3.36556C0.700195 2.62889 1.29686 2.03223 2.03353 2.03223H5.36686" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const EditarRol: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M0.75 14.5383L4.98543 13.5418L14.2465 4.28075C14.6356 3.89156 14.6356 3.26057 14.2465 2.87138L12.417 1.04189C12.0278 0.652702 11.3968 0.652702 11.0076 1.04189L1.74657 10.3029L0.75 14.5383Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M15.1999 14.5381H9.71875" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const ArchivarRol: React.FC<IconProps> = ({ size = 17, className }) => (
  <svg width={size} height={size} viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M2.64551 3.96582L3.53307 14.1728C3.62789 15.2633 4.54083 16.1003 5.63548 16.1003H10.7349C11.8295 16.1003 12.7425 15.2633 12.8372 14.1728L13.7248 3.96582" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M5.81152 3.70153V2.91015C5.81152 1.74464 6.75632 0.799805 7.92187 0.799805H8.44945C9.615 0.799805 10.5598 1.74464 10.5598 2.91015V3.70153" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M0.799805 3.96582H15.5722" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const DashboardPermisos: React.FC<IconProps> = ({ size = 26, className }) => (
  <svg width={size} height={size} viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect width="26" height="26" rx="6" fill="white" />
    <path d="M14.5761 13.3042L14.8753 14.5009" stroke="#002C4D" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M13.7502 16.0493C12.6921 16.2593 11.594 16.0363 10.7017 15.4302C10.5519 15.3305 10.3686 15.2943 10.1922 15.3296L8.05682 15.7565C7.00451 15.9669 6.24707 16.8908 6.24707 17.964V18.2521" stroke="#002C4D" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M16.0015 9.24869H9.99902" stroke="#002C4D" strokeLinecap="round" strokeLinejoin="round" />
    <path fillRule="evenodd" clipRule="evenodd" d="M11.4996 6.24707H14.5009C15.3297 6.24707 16.0015 6.91892 16.0015 7.7477V10.7489C16.0015 12.4065 14.6578 13.7502 13.0003 13.7502V13.7502C11.3427 13.7502 9.99902 12.4065 9.99902 10.7489V7.7477C9.99902 6.91892 10.6709 6.24707 11.4996 6.24707Z" stroke="#002C4D" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M11.4254 13.3042L10.8679 15.5341" stroke="#002C4D" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="17.8771" cy="17.5021" r="2.62609" stroke="#002C4D" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M18.7527 17.0645L17.6591 18.1586L17.002 17.5021" stroke="#002C4D" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M9.99918 15.3687V18.2524" stroke="#002C4D" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="9.99852" cy="19.3779" r="1.12547" stroke="#002C4D" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const FuncionariosPermisos: React.FC<IconProps> = ({ size = 24, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect width="24" height="24" rx="6" fill="#EEF7FF" />
    <g clipPath="url(#clip0_581_26280)">
      <path d="M5.2002 7.07606C5.2002 6.04005 6.04005 5.2002 7.07606 5.2002H16.9243C17.9604 5.2002 18.8002 6.04005 18.8002 7.07606V16.9243C18.8002 17.9604 17.9604 18.8002 16.9243 18.8002H7.07606C6.04005 18.8002 5.2002 17.9604 5.2002 16.9243V7.07606Z" stroke="#2B506B" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.88965 8.95166V18.5655" stroke="#2B506B" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5.43457 8.48291H18.5656" stroke="#2B506B" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </g>
    <defs>
      <clipPath id="clip0_581_26280">
        <rect width="16" height="16" fill="white" transform="translate(4 4)" />
      </clipPath>
    </defs>
  </svg>
);

export const ContratistaPermisos: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <g clipPath="url(#clip0_581_16325)">
      <path d="M1.2002 3.07606C1.2002 2.04005 2.04005 1.2002 3.07606 1.2002H12.9243C13.9604 1.2002 14.8002 2.04005 14.8002 3.07606V12.9243C14.8002 13.9604 13.9604 14.8002 12.9243 14.8002H3.07606C2.04005 14.8002 1.2002 13.9604 1.2002 12.9243V3.07606Z" stroke="#2B506B" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5.88965 4.95166V14.5655" stroke="#2B506B" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M1.43457 4.48291H14.5656" stroke="#2B506B" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </g>
    <defs>
      <clipPath id="clip0_581_16325">
        <rect width="16" height="16" fill="white" />
      </clipPath>
    </defs>
  </svg>
);

export const DesactivarRol: React.FC<IconProps> = ({ size = 24, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M11.9987 3V12.001" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M18.3631 5.63867C21.8771 9.15268 21.8771 14.8503 18.3631 18.3643C14.8491 21.8784 9.15147 21.8784 5.63746 18.3643C2.12345 14.8503 2.12345 9.15268 5.63746 5.63867" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const OjoIcon: React.FC<IconProps> = ({ size = 20, className }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M18.5 9.99995C18.5 11.1724 16.4483 17.3275 10 17.3275C3.55172 17.3275 1.5 11.1724 1.5 9.99995C1.5 8.82754 3.55172 2.67236 10 2.67236C16.4483 2.67236 18.5 8.82754 18.5 9.99995Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M9.99926 12.6377C11.4561 12.6377 12.6372 11.4566 12.6372 9.99975C12.6372 8.54286 11.4561 7.36182 9.99926 7.36182C8.54237 7.36182 7.36133 8.54286 7.36133 9.99975C7.36133 11.4566 8.54237 12.6377 9.99926 12.6377Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const EquisIcon: React.FC<IconProps> = ({ size = 20, className }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M1.5 10C1.5 5.30559 5.30559 1.5 10 1.5C14.6945 1.5 18.5 5.30559 18.5 10C18.5 14.6945 14.6945 18.5 10 18.5C5.30559 18.5 1.5 14.6945 1.5 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M7.36133 7.36328L12.6372 12.6391" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12.6372 7.36328L7.36133 12.6391" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);


export const Filtrar: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <g clipPath="url(#clip0_480_46409)">
      <path d="M14.8402 1.16016H1.16016L5.46392 6.53989C5.73158 6.87443 5.8774 7.29012 5.8774 7.71863V13.8967C5.8774 14.4178 6.29978 14.8402 6.82085 14.8402H9.17947C9.70053 14.8402 10.1229 14.4178 10.1229 13.8967V7.71863C10.1229 7.29012 10.2688 6.87443 10.5364 6.53989L14.8402 1.16016Z" stroke="currentColor" strokeWidth="1.14" strokeLinecap="round" strokeLinejoin="round" />
    </g>
    <defs>
      <clipPath id="clip0_480_46409">
        <rect width="16" height="16" fill="white" />
      </clipPath>
    </defs>
  </svg>
);

