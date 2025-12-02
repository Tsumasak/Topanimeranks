import svgPaths from "./svg-egk9t6vzpq";
import imgFrame2 from "figma:asset/023dc6b41eafabdb869df8e99a3d9dc43323e4a8.png";
import imgFrame3 from "figma:asset/a5032e35cff8c788e6f5054a81a523294056dd2c.png";
import imgFrame4 from "figma:asset/0e7f38708c9d652f5436dffe7f66536e3beb2043.png";

function Icon() {
  return (
    <div className="h-[50px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <div className="absolute bottom-[0.16%] left-0 right-[0.03%] top-0" data-name="Union">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 105 50">
          <path d={svgPaths.p2c975280} fill="var(--fill-0, white)" id="Union" />
        </svg>
      </div>
    </div>
  );
}

function Union() {
  return (
    <div className="absolute content-stretch flex flex-col h-[50px] items-start left-0 top-0 w-[104.234px]" data-name="Union">
      <Icon />
    </div>
  );
}

function Button() {
  return (
    <div className="h-[50px] relative shrink-0 w-[104.234px]" data-name="Button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border h-[50px] relative w-[104.234px]">
        <Union />
      </div>
    </div>
  );
}

function Container() {
  return (
    <div className="bg-slate-100 h-[20px] opacity-30 relative shrink-0 w-px" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border h-[20px] w-px" />
    </div>
  );
}

function Container1() {
  return (
    <div className="h-full relative shrink-0" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex gap-[16px] h-full items-center relative">
        <p className="font-['Arial:Regular',sans-serif] leading-[24px] not-italic relative shrink-0 text-[16px] text-nowrap text-slate-100 whitespace-pre">Weekly Anime Episodes</p>
        <Container />
        <p className="font-['Arial:Regular',sans-serif] leading-[24px] not-italic relative shrink-0 text-[16px] text-nowrap text-slate-100 whitespace-pre">Top Season Animes</p>
        <Container />
        <p className="font-['Arial:Regular',sans-serif] leading-[24px] not-italic relative shrink-0 text-[16px] text-nowrap text-slate-100 whitespace-pre">Most Anticipated Animes</p>
      </div>
    </div>
  );
}

function Icon1() {
  return (
    <div className="relative shrink-0 size-[20px]" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <g clipPath="url(#clip0_209_202)" id="Icon">
          <path d={svgPaths.p20d10600} id="Vector" stroke="var(--stroke-0, #F1F5F9)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
          <path d="M10 1.66667V3.33333" id="Vector_2" stroke="var(--stroke-0, #F1F5F9)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
          <path d="M10 16.6667V18.3333" id="Vector_3" stroke="var(--stroke-0, #F1F5F9)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
          <path d={svgPaths.p1fc28080} id="Vector_4" stroke="var(--stroke-0, #F1F5F9)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
          <path d={svgPaths.p1a2cf7c0} id="Vector_5" stroke="var(--stroke-0, #F1F5F9)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
          <path d="M1.66667 10H3.33333" id="Vector_6" stroke="var(--stroke-0, #F1F5F9)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
          <path d="M16.6667 10H18.3333" id="Vector_7" stroke="var(--stroke-0, #F1F5F9)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
          <path d={svgPaths.p3a4ddb80} id="Vector_8" stroke="var(--stroke-0, #F1F5F9)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
          <path d={svgPaths.p18688e80} id="Vector_9" stroke="var(--stroke-0, #F1F5F9)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
        </g>
        <defs>
          <clipPath id="clip0_209_202">
            <rect fill="white" height="20" width="20" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Button1() {
  return (
    <div className="relative rounded-[6.8px] shrink-0 size-[40px]" data-name="Button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex items-center justify-center relative size-[40px]">
        <Icon1 />
      </div>
    </div>
  );
}

function Search() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="search">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="search" opacity="0.5">
          <path d={svgPaths.p2ec9f200} id="Icon" stroke="var(--stroke-0, #CBD5E1)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" />
        </g>
      </svg>
    </div>
  );
}

function Frame9() {
  return (
    <div className="bg-slate-900 h-full relative rounded-[10px] shrink-0 w-[336px]">
      <div aria-hidden="true" className="absolute border border-slate-700 border-solid inset-0 pointer-events-none rounded-[10px]" />
      <div className="flex flex-row items-center size-full">
        <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex gap-[8px] h-full items-center px-[12px] py-[24px] relative w-[336px]">
          <Search />
          <p className="font-['Arial:Regular',sans-serif] leading-[24px] not-italic relative shrink-0 text-[14px] text-nowrap text-slate-100 whitespace-pre">Winter</p>
        </div>
      </div>
    </div>
  );
}

function Container2() {
  return (
    <div className="h-[40px] relative shrink-0" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex gap-[16px] h-[40px] items-center relative">
        <Container1 />
        <Button1 />
        <Frame9 />
      </div>
    </div>
  );
}

function Navigation() {
  return (
    <div className="content-stretch flex h-[82px] items-center justify-between relative shrink-0 w-full" data-name="Navigation">
      <Button />
      <Container2 />
    </div>
  );
}

function Frame1() {
  return (
    <div className="h-[85px] relative rounded-[4px] shrink-0 w-[61px]">
      <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none rounded-[4px] size-full" src={imgFrame2} />
    </div>
  );
}

function Text() {
  return (
    <div className="bg-cyan-700 box-border content-stretch flex gap-[10px] items-center justify-center px-[8px] py-[4px] relative rounded-[3.35544e+07px] shrink-0" data-name="Text">
      <p className="font-['Arial:Regular',sans-serif] leading-[16px] not-italic relative shrink-0 text-[12px] text-nowrap text-white whitespace-pre">Winter 2026</p>
    </div>
  );
}

function Text1() {
  return (
    <div className="bg-slate-700 box-border content-stretch flex gap-[10px] items-center justify-center px-[8px] py-[4px] relative rounded-[3.35544e+07px] shrink-0" data-name="Text">
      <div aria-hidden="true" className="absolute border border-slate-700 border-solid inset-0 pointer-events-none rounded-[3.35544e+07px]" />
      <p className="font-['Arial:Regular',sans-serif] leading-[16px] not-italic relative shrink-0 text-[12px] text-nowrap text-slate-100 whitespace-pre">Action</p>
    </div>
  );
}

function Text2() {
  return (
    <div className="bg-slate-700 box-border content-stretch flex gap-[10px] items-center justify-center px-[8px] py-[4px] relative rounded-[3.35544e+07px] shrink-0" data-name="Text">
      <div aria-hidden="true" className="absolute border border-slate-700 border-solid inset-0 pointer-events-none rounded-[3.35544e+07px]" />
      <p className="font-['Arial:Regular',sans-serif] leading-[16px] not-italic relative shrink-0 text-[12px] text-nowrap text-slate-100 whitespace-pre">Comedy</p>
    </div>
  );
}

function Text3() {
  return (
    <div className="bg-slate-700 box-border content-stretch flex gap-[10px] items-center justify-center px-[8px] py-[4px] relative rounded-[3.35544e+07px] shrink-0" data-name="Text">
      <div aria-hidden="true" className="absolute border border-slate-700 border-solid inset-0 pointer-events-none rounded-[3.35544e+07px]" />
      <p className="font-['Arial:Regular',sans-serif] leading-[16px] not-italic relative shrink-0 text-[12px] text-nowrap text-slate-100 whitespace-pre">Fantasy</p>
    </div>
  );
}

function Frame7() {
  return (
    <div className="relative shrink-0">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex gap-[12px] items-start relative">
        <Text />
        <Text1 />
        <Text2 />
        <Text3 />
      </div>
    </div>
  );
}

function Container3() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-[450px]" data-name="Container">
      <p className="font-['Arial:Bold',sans-serif] leading-[19.8px] min-w-full not-italic relative shrink-0 text-[18px] text-slate-100 w-[min-content]">{`Frieren: Beyond Journey's End Season 2`}</p>
      <Frame7 />
    </div>
  );
}

function Frame() {
  return (
    <div className="bg-slate-800 relative rounded-[10px] shrink-0 w-full">
      <div aria-hidden="true" className="absolute border border-slate-700 border-solid inset-0 pointer-events-none rounded-[10px] shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.3)]" />
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[24px] items-center p-[8px] relative w-full">
          <Frame1 />
          <Container3 />
        </div>
      </div>
    </div>
  );
}

function Frame2() {
  return (
    <div className="h-[85px] relative rounded-[4px] shrink-0 w-[61px]">
      <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none rounded-[4px] size-full" src={imgFrame3} />
    </div>
  );
}

function Text4() {
  return (
    <div className="bg-cyan-700 box-border content-stretch flex items-center justify-between px-[8px] py-[4px] relative rounded-[3.35544e+07px] shrink-0 w-[81px]" data-name="Text">
      <p className="font-['Arial:Regular',sans-serif] leading-[16px] not-italic relative shrink-0 text-[12px] text-nowrap text-white whitespace-pre">Winter 2026</p>
    </div>
  );
}

function Text5() {
  return (
    <div className="bg-slate-700 box-border content-stretch flex gap-[10px] items-center justify-center px-[8px] py-[4px] relative rounded-[3.35544e+07px] shrink-0" data-name="Text">
      <div aria-hidden="true" className="absolute border border-slate-700 border-solid inset-0 pointer-events-none rounded-[3.35544e+07px]" />
      <p className="font-['Arial:Regular',sans-serif] leading-[16px] not-italic relative shrink-0 text-[12px] text-nowrap text-slate-100 whitespace-pre">Action</p>
    </div>
  );
}

function Text6() {
  return (
    <div className="bg-slate-700 box-border content-stretch flex gap-[10px] items-center justify-center px-[8px] py-[4px] relative rounded-[3.35544e+07px] shrink-0" data-name="Text">
      <div aria-hidden="true" className="absolute border border-slate-700 border-solid inset-0 pointer-events-none rounded-[3.35544e+07px]" />
      <p className="font-['Arial:Regular',sans-serif] leading-[16px] not-italic relative shrink-0 text-[12px] text-nowrap text-slate-100 whitespace-pre">Adventure</p>
    </div>
  );
}

function Text7() {
  return (
    <div className="bg-slate-700 box-border content-stretch flex gap-[10px] items-center justify-center px-[8px] py-[4px] relative rounded-[3.35544e+07px] shrink-0" data-name="Text">
      <div aria-hidden="true" className="absolute border border-slate-700 border-solid inset-0 pointer-events-none rounded-[3.35544e+07px]" />
      <p className="font-['Arial:Regular',sans-serif] leading-[16px] not-italic relative shrink-0 text-[12px] text-nowrap text-slate-100 whitespace-pre">Supernatural</p>
    </div>
  );
}

function Text8() {
  return (
    <div className="bg-slate-700 box-border content-stretch flex gap-[10px] items-center justify-center px-[8px] py-[4px] relative rounded-[3.35544e+07px] shrink-0" data-name="Text">
      <div aria-hidden="true" className="absolute border border-slate-700 border-solid inset-0 pointer-events-none rounded-[3.35544e+07px]" />
      <p className="font-['Arial:Regular',sans-serif] leading-[16px] not-italic relative shrink-0 text-[12px] text-nowrap text-slate-100 whitespace-pre">Gore</p>
    </div>
  );
}

function Text9() {
  return (
    <div className="bg-slate-700 box-border content-stretch flex gap-[10px] items-center justify-center px-[8px] py-[4px] relative rounded-[3.35544e+07px] shrink-0" data-name="Text">
      <div aria-hidden="true" className="absolute border border-slate-700 border-solid inset-0 pointer-events-none rounded-[3.35544e+07px]" />
      <p className="font-['Arial:Regular',sans-serif] leading-[16px] not-italic relative shrink-0 text-[12px] text-nowrap text-slate-100 whitespace-pre">Historical</p>
    </div>
  );
}

function Frame8() {
  return (
    <div className="relative shrink-0">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex gap-[12px] items-start relative">
        <Text4 />
        <Text5 />
        <Text6 />
        <Text7 />
        <Text8 />
        <Text9 />
      </div>
    </div>
  );
}

function Container4() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-[450px]" data-name="Container">
      <p className="font-['Arial:Bold',sans-serif] leading-[19.8px] min-w-full not-italic relative shrink-0 text-[18px] text-slate-100 w-[min-content]">{`Hells Paradise Season 2 `}</p>
      <Frame8 />
    </div>
  );
}

function Frame5() {
  return (
    <div className="relative rounded-[10px] shrink-0 w-full">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[12px] items-center p-[8px] relative w-full">
          <Frame2 />
          <Container4 />
        </div>
      </div>
    </div>
  );
}

function Frame3() {
  return (
    <div className="h-[85px] relative rounded-[4px] shrink-0 w-[61px]">
      <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none rounded-[4px] size-full" src={imgFrame4} />
    </div>
  );
}

function Text10() {
  return (
    <div className="bg-cyan-700 box-border content-stretch flex items-center justify-between px-[8px] py-[4px] relative rounded-[3.35544e+07px] shrink-0 w-[81px]" data-name="Text">
      <p className="font-['Arial:Regular',sans-serif] leading-[16px] not-italic relative shrink-0 text-[12px] text-nowrap text-white whitespace-pre">Winter 2026</p>
    </div>
  );
}

function Text11() {
  return (
    <div className="bg-slate-700 box-border content-stretch flex gap-[10px] items-center justify-center px-[8px] py-[4px] relative rounded-[3.35544e+07px] shrink-0" data-name="Text">
      <div aria-hidden="true" className="absolute border border-slate-700 border-solid inset-0 pointer-events-none rounded-[3.35544e+07px]" />
      <p className="font-['Arial:Regular',sans-serif] leading-[16px] not-italic relative shrink-0 text-[12px] text-nowrap text-slate-100 whitespace-pre">Action</p>
    </div>
  );
}

function Text12() {
  return (
    <div className="bg-slate-700 box-border content-stretch flex gap-[10px] items-center justify-center px-[8px] py-[4px] relative rounded-[3.35544e+07px] shrink-0" data-name="Text">
      <div aria-hidden="true" className="absolute border border-slate-700 border-solid inset-0 pointer-events-none rounded-[3.35544e+07px]" />
      <p className="font-['Arial:Regular',sans-serif] leading-[16px] not-italic relative shrink-0 text-[12px] text-nowrap text-slate-100 whitespace-pre">Supernatural</p>
    </div>
  );
}

function Text13() {
  return (
    <div className="bg-slate-700 box-border content-stretch flex gap-[10px] items-center justify-center px-[8px] py-[4px] relative rounded-[3.35544e+07px] shrink-0" data-name="Text">
      <div aria-hidden="true" className="absolute border border-slate-700 border-solid inset-0 pointer-events-none rounded-[3.35544e+07px]" />
      <p className="font-['Arial:Regular',sans-serif] leading-[16px] not-italic relative shrink-0 text-[12px] text-nowrap text-slate-100 whitespace-pre">School</p>
    </div>
  );
}

function Frame10() {
  return (
    <div className="content-stretch flex gap-[12px] items-start relative shrink-0">
      <Text10 />
      <Text11 />
      <Text12 />
      <Text13 />
    </div>
  );
}

function Frame4() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-[450px]">
      <p className="font-['Arial:Bold',sans-serif] leading-[19.8px] min-w-full not-italic relative shrink-0 text-[18px] text-slate-100 w-[min-content]">Jujutsu Kaisen Season 3</p>
      <Frame10 />
    </div>
  );
}

function Frame6() {
  return (
    <div className="relative rounded-[10px] shrink-0 w-full">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[12px] items-center p-[8px] relative w-full">
          <Frame3 />
          <Frame4 />
        </div>
      </div>
    </div>
  );
}

function Frame11() {
  return (
    <div className="bg-slate-900 box-border content-stretch flex flex-col gap-[8px] items-end p-[12px] relative rounded-[10px] shrink-0 w-[600px]">
      <div aria-hidden="true" className="absolute border border-slate-700 border-solid inset-0 pointer-events-none rounded-[10px]" />
      <Frame />
      <Frame5 />
      <Frame6 />
      <p className="font-['Arial:Bold',sans-serif] leading-[20px] not-italic relative shrink-0 text-[14px] text-amber-400 text-nowrap text-right whitespace-pre">View all results</p>
    </div>
  );
}

export default function Header() {
  return (
    <div className="bg-slate-800 relative shadow-[0px_1px_3px_0px_rgba(0,0,0,0.3)] size-full" data-name="Header">
      <div className="flex flex-col items-end size-full">
        <div className="box-border content-stretch flex flex-col gap-[8px] items-end px-[305px] py-0 relative size-full">
          <Navigation />
          <Frame11 />
        </div>
      </div>
    </div>
  );
}