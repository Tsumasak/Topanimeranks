import svgPaths from "./svg-dgklui4m7m";

function Text() {
  return (
    <div className="absolute content-stretch flex h-[32px] items-start left-0 top-0 w-[32.953px]" data-name="Text">
      <p className="flex-[1_0_0] font-['Segoe_UI:Bold',sans-serif] leading-[32px] min-h-px min-w-px not-italic relative text-[#f1f5f9] text-[24px] whitespace-pre-wrap">📈</p>
    </div>
  );
}

function Heading() {
  return (
    <div className="flex-[1_0_0] h-[32px] min-h-px min-w-px relative" data-name="Heading 2">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Text />
        <p className="absolute font-['Segoe_UI:Bold',sans-serif] leading-[32px] left-[40.95px] not-italic text-[#f1f5f9] text-[24px] top-0 whitespace-pre">Rank Evolution</p>
      </div>
    </div>
  );
}

function Option() {
  return (
    <div className="h-0 relative shrink-0 w-full" data-name="Option">
      <p className="absolute font-['Segoe_UI:Regular',sans-serif] leading-[normal] left-0 not-italic text-[#f1f5f9] text-[14px] top-0 w-0 whitespace-pre-wrap">Spring 2025</p>
    </div>
  );
}

function Option1() {
  return (
    <div className="h-0 relative shrink-0 w-full" data-name="Option">
      <p className="absolute font-['Segoe_UI:Regular',sans-serif] leading-[normal] left-0 not-italic text-[#f1f5f9] text-[14px] top-0 w-0 whitespace-pre-wrap">Summer 2025</p>
    </div>
  );
}

function Dropdown() {
  return (
    <div className="bg-[#0f172a] h-[35px] relative rounded-[10px] shrink-0 w-[132px]" data-name="Dropdown">
      <div aria-hidden="true" className="absolute border border-[#334155] border-solid inset-0 pointer-events-none rounded-[10px]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start pb-px pl-[-1043.172px] pr-[1175.172px] pt-[-662px] relative size-full">
        <Option />
        <Option1 />
      </div>
    </div>
  );
}

function Container1() {
  return (
    <div className="h-[35px] relative shrink-0 w-[359.016px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[16px] items-center relative size-full">
        <Heading />
        <Dropdown />
      </div>
    </div>
  );
}

function Container4() {
  return (
    <div className="content-stretch flex h-[16px] items-start opacity-60 relative shrink-0 w-full" data-name="Container">
      <p className="font-['Segoe_UI:Regular',sans-serif] leading-[16px] not-italic relative shrink-0 text-[#f1f5f9] text-[12px] text-center whitespace-pre">Avg Position</p>
    </div>
  );
}

function Container5() {
  return (
    <div className="h-[28px] relative shrink-0 w-full" data-name="Container">
      <p className="absolute font-['Segoe_UI:Bold',sans-serif] leading-[28px] left-[32.95px] not-italic text-[#fbbf24] text-[20px] text-center top-0 translate-x-[-50%] w-[52px] whitespace-pre-wrap">#7.08</p>
    </div>
  );
}

function Container3() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[4px] h-[48px] items-start left-0 top-0 w-[65.719px]" data-name="Container">
      <Container4 />
      <Container5 />
    </div>
  );
}

function Icon() {
  return (
    <div className="absolute left-0 size-[12px] top-[2px]" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 12">
        <g clipPath="url(#clip0_343_2445)" id="Icon">
          <path d={svgPaths.p295e8380} id="Vector" stroke="var(--stroke-0, #F1F5F9)" strokeLinecap="round" strokeLinejoin="round" />
        </g>
        <defs>
          <clipPath id="clip0_343_2445">
            <rect fill="white" height="12" width="12" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Container7() {
  return (
    <div className="h-[16px] opacity-60 relative shrink-0 w-full" data-name="Container">
      <Icon />
      <p className="absolute font-['Segoe_UI:Regular',sans-serif] leading-[16px] left-[43px] not-italic text-[#f1f5f9] text-[12px] text-center top-0 translate-x-[-50%] whitespace-pre">Avg Score</p>
    </div>
  );
}

function Container8() {
  return (
    <div className="content-stretch flex h-[28px] items-start relative shrink-0 w-full" data-name="Container">
      <p className="flex-[1_0_0] font-['Segoe_UI:Bold',sans-serif] leading-[28px] min-h-px min-w-px not-italic relative text-[#f1f5f9] text-[20px] text-center whitespace-pre-wrap">4.49</p>
    </div>
  );
}

function Container6() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[4px] h-[48px] items-start left-[81.72px] top-0 w-[69.016px]" data-name="Container">
      <Container7 />
      <Container8 />
    </div>
  );
}

function Icon1() {
  return (
    <div className="absolute left-0 size-[12px] top-[2px]" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 12">
        <g id="Icon">
          <path d={svgPaths.p118b8900} id="Vector" stroke="var(--stroke-0, #F1F5F9)" strokeLinecap="round" strokeLinejoin="round" />
          <path d={svgPaths.p5086800} id="Vector_2" stroke="var(--stroke-0, #F1F5F9)" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </svg>
    </div>
  );
}

function Container10() {
  return (
    <div className="h-[16px] opacity-60 relative shrink-0 w-full" data-name="Container">
      <Icon1 />
      <p className="absolute font-['Segoe_UI:Regular',sans-serif] leading-[16px] left-[27.5px] not-italic text-[#f1f5f9] text-[12px] text-center top-0 translate-x-[-50%] whitespace-pre">Best</p>
    </div>
  );
}

function Container11() {
  return (
    <div className="h-[28px] relative shrink-0 w-full" data-name="Container">
      <p className="absolute font-['Segoe_UI:Bold',sans-serif] leading-[28px] left-[19.47px] not-italic text-[#f1f5f9] text-[20px] text-center top-0 translate-x-[-50%] w-[24px] whitespace-pre-wrap">#1</p>
    </div>
  );
}

function Container9() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[4px] h-[48px] items-start left-[166.73px] top-0 w-[38.313px]" data-name="Container">
      <Container10 />
      <Container11 />
    </div>
  );
}

function Icon2() {
  return (
    <div className="absolute left-0 size-[12px] top-[2px]" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 12">
        <g id="Icon">
          <path d="M8 3.5H11V6.5" id="Vector" stroke="var(--stroke-0, #F1F5F9)" strokeLinecap="round" strokeLinejoin="round" />
          <path d={svgPaths.p3a7e7417} id="Vector_2" stroke="var(--stroke-0, #F1F5F9)" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </svg>
    </div>
  );
}

function Container13() {
  return (
    <div className="h-[16px] opacity-60 relative shrink-0 w-full" data-name="Container">
      <Icon2 />
      <p className="absolute font-['Segoe_UI:Regular',sans-serif] leading-[16px] left-[31px] not-italic text-[#f1f5f9] text-[12px] text-center top-0 translate-x-[-50%] whitespace-pre">Trend</p>
    </div>
  );
}

function Container14() {
  return (
    <div className="h-[28px] relative shrink-0 w-full" data-name="Container">
      <p className="absolute font-['Segoe_UI:Bold',sans-serif] leading-[28px] left-[22.95px] not-italic text-[#f1f5f9] text-[20px] text-center top-0 translate-x-[-50%] w-[26px] whitespace-pre-wrap">+7</p>
    </div>
  );
}

function Container12() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[4px] h-[48px] items-start left-[221.05px] top-0 w-[45.563px]" data-name="Container">
      <Container13 />
      <Container14 />
    </div>
  );
}

function Container2() {
  return (
    <div className="h-[48px] relative shrink-0 w-[266.609px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Container3 />
        <Container6 />
        <Container9 />
        <Container12 />
      </div>
    </div>
  );
}

function Container() {
  return (
    <div className="content-stretch flex h-[48px] items-start justify-between relative shrink-0 w-full" data-name="Container">
      <Container1 />
      <Container2 />
    </div>
  );
}

function Group2() {
  return (
    <div className="absolute inset-[3.57%_1.07%_28.57%_5.37%]" data-name="Group">
      <div className="absolute inset-[-0.26%_0]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 871 191">
          <g id="Group">
            <path d="M0 0.5H871" id="Vector" opacity="0.3" stroke="var(--stroke-0, #334155)" strokeDasharray="3 3" />
            <path d="M0 52.3182H871" id="Vector_2" opacity="0.3" stroke="var(--stroke-0, #334155)" strokeDasharray="3 3" />
            <path d="M0 104.136H871" id="Vector_3" opacity="0.3" stroke="var(--stroke-0, #334155)" strokeDasharray="3 3" />
            <path d="M0 155.955H871" id="Vector_4" opacity="0.3" stroke="var(--stroke-0, #334155)" strokeDasharray="3 3" />
            <path d="M0 190.5H871" id="Vector_5" opacity="0.3" stroke="var(--stroke-0, #334155)" strokeDasharray="3 3" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function Group3() {
  return (
    <div className="absolute inset-[3.57%_1.07%_28.57%_5.37%]" data-name="Group">
      <div className="absolute inset-[0_-0.06%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 872 190">
          <g id="Group">
            <path d="M0.5 0V190" id="Vector" opacity="0.3" stroke="var(--stroke-0, #334155)" strokeDasharray="3 3" />
            <path d="M38.3696 0V190" id="Vector_2" opacity="0.3" stroke="var(--stroke-0, #334155)" strokeDasharray="3 3" />
            <path d="M76.2391 0V190" id="Vector_3" opacity="0.3" stroke="var(--stroke-0, #334155)" strokeDasharray="3 3" />
            <path d="M114.109 0V190" id="Vector_4" opacity="0.3" stroke="var(--stroke-0, #334155)" strokeDasharray="3 3" />
            <path d="M151.978 0V190" id="Vector_5" opacity="0.3" stroke="var(--stroke-0, #334155)" strokeDasharray="3 3" />
            <path d="M189.848 0V190" id="Vector_6" opacity="0.3" stroke="var(--stroke-0, #334155)" strokeDasharray="3 3" />
            <path d="M227.717 0V190" id="Vector_7" opacity="0.3" stroke="var(--stroke-0, #334155)" strokeDasharray="3 3" />
            <path d="M265.587 0V190" id="Vector_8" opacity="0.3" stroke="var(--stroke-0, #334155)" strokeDasharray="3 3" />
            <path d="M303.457 0V190" id="Vector_9" opacity="0.3" stroke="var(--stroke-0, #334155)" strokeDasharray="3 3" />
            <path d="M341.326 0V190" id="Vector_10" opacity="0.3" stroke="var(--stroke-0, #334155)" strokeDasharray="3 3" />
            <path d="M379.196 0V190" id="Vector_11" opacity="0.3" stroke="var(--stroke-0, #334155)" strokeDasharray="3 3" />
            <path d="M417.065 0V190" id="Vector_12" opacity="0.3" stroke="var(--stroke-0, #334155)" strokeDasharray="3 3" />
            <path d="M454.935 0V190" id="Vector_13" opacity="0.3" stroke="var(--stroke-0, #334155)" strokeDasharray="3 3" />
            <path d="M492.804 0V190" id="Vector_14" opacity="0.3" stroke="var(--stroke-0, #334155)" strokeDasharray="3 3" />
            <path d="M530.674 0V190" id="Vector_15" opacity="0.3" stroke="var(--stroke-0, #334155)" strokeDasharray="3 3" />
            <path d="M568.543 0V190" id="Vector_16" opacity="0.3" stroke="var(--stroke-0, #334155)" strokeDasharray="3 3" />
            <path d="M606.413 0V190" id="Vector_17" opacity="0.3" stroke="var(--stroke-0, #334155)" strokeDasharray="3 3" />
            <path d="M644.283 0V190" id="Vector_18" opacity="0.3" stroke="var(--stroke-0, #334155)" strokeDasharray="3 3" />
            <path d="M682.152 0V190" id="Vector_19" opacity="0.3" stroke="var(--stroke-0, #334155)" strokeDasharray="3 3" />
            <path d="M720.022 0V190" id="Vector_20" opacity="0.3" stroke="var(--stroke-0, #334155)" strokeDasharray="3 3" />
            <path d="M757.891 0V190" id="Vector_21" opacity="0.3" stroke="var(--stroke-0, #334155)" strokeDasharray="3 3" />
            <path d="M795.761 0V190" id="Vector_22" opacity="0.3" stroke="var(--stroke-0, #334155)" strokeDasharray="3 3" />
            <path d="M833.63 0V190" id="Vector_23" opacity="0.3" stroke="var(--stroke-0, #334155)" strokeDasharray="3 3" />
            <path d="M871.5 0V190" id="Vector_24" opacity="0.3" stroke="var(--stroke-0, #334155)" strokeDasharray="3 3" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function Group1() {
  return (
    <div className="absolute contents inset-[3.57%_1.07%_28.57%_5.37%]" data-name="Group">
      <Group2 />
      <Group3 />
    </div>
  );
}

function Group() {
  return (
    <div className="absolute contents inset-[3.57%_1.07%_28.57%_5.37%]" data-name="Group">
      <Group1 />
    </div>
  );
}

function Group6() {
  return (
    <div className="absolute inset-[3.14%_0.8%_28.57%_5.37%]" data-name="Group">
      <div className="absolute inset-[-0.78%_0_0_-0.14%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 874.754 192.708">
          <g id="Group">
            <path d={svgPaths.p21579100} fill="url(#paint0_linear_343_2441)" fillOpacity="0.6" id="recharts-area-:r1f:" />
            <path d={svgPaths.p3fc57d40} id="Vector" stroke="var(--stroke-0, #FBBF24)" strokeWidth="3" />
          </g>
          <defs>
            <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_343_2441" x1="1.24446" x2="1.24446" y1="175.445" y2="1.49893">
              <stop stopColor="#FBBF24" stopOpacity="0" />
              <stop offset="1" stopColor="#FBBF24" stopOpacity="0.35" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
}

function Group5() {
  return (
    <div className="absolute contents inset-[3.14%_0.8%_28.57%_5.37%]" data-name="Group">
      <Group6 />
    </div>
  );
}

function Group4() {
  return (
    <div className="absolute contents inset-[3.14%_0.8%_28.57%_5.37%]" data-name="Group">
      <Group5 />
    </div>
  );
}

function Group11() {
  return (
    <div className="absolute inset-[71.43%_94.63%_26.43%_5.37%]" data-name="Group">
      <div className="absolute inset-[0_-0.5px]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 6">
          <g id="Group">
            <path d="M0.5 6V0" id="Vector" opacity="0.2" stroke="var(--stroke-0, #F1F5F9)" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function Group12() {
  return (
    <div className="absolute inset-[71.43%_90.56%_26.43%_9.44%]" data-name="Group">
      <div className="absolute inset-[0_-0.5px]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 6">
          <g id="Group">
            <path d="M0.5 6V0" id="Vector" opacity="0.2" stroke="var(--stroke-0, #F1F5F9)" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function Group13() {
  return (
    <div className="absolute inset-[71.43%_86.49%_26.43%_13.51%]" data-name="Group">
      <div className="absolute inset-[0_-0.5px]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 6">
          <g id="Group">
            <path d="M0.5 6V0" id="Vector" opacity="0.2" stroke="var(--stroke-0, #F1F5F9)" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function Group14() {
  return (
    <div className="absolute inset-[71.43%_82.43%_26.43%_17.57%]" data-name="Group">
      <div className="absolute inset-[0_-0.5px]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 6">
          <g id="Group">
            <path d="M0.5 6V0" id="Vector" opacity="0.2" stroke="var(--stroke-0, #F1F5F9)" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function Group15() {
  return (
    <div className="absolute inset-[71.43%_78.36%_26.43%_21.64%]" data-name="Group">
      <div className="absolute inset-[0_-0.5px]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 6">
          <g id="Group">
            <path d="M0.5 6V0" id="Vector" opacity="0.2" stroke="var(--stroke-0, #F1F5F9)" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function Group16() {
  return (
    <div className="absolute inset-[71.43%_74.29%_26.43%_25.71%]" data-name="Group">
      <div className="absolute inset-[0_-0.5px]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 6">
          <g id="Group">
            <path d="M0.5 6V0" id="Vector" opacity="0.2" stroke="var(--stroke-0, #F1F5F9)" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function Group17() {
  return (
    <div className="absolute inset-[71.43%_70.22%_26.43%_29.78%]" data-name="Group">
      <div className="absolute inset-[0_-0.5px]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 6">
          <g id="Group">
            <path d="M0.5 6V0" id="Vector" opacity="0.2" stroke="var(--stroke-0, #F1F5F9)" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function Group18() {
  return (
    <div className="absolute inset-[71.43%_66.16%_26.43%_33.84%]" data-name="Group">
      <div className="absolute inset-[0_-0.5px]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 6">
          <g id="Group">
            <path d="M0.5 6V0" id="Vector" opacity="0.2" stroke="var(--stroke-0, #F1F5F9)" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function Group19() {
  return (
    <div className="absolute inset-[71.43%_62.09%_26.43%_37.91%]" data-name="Group">
      <div className="absolute inset-[0_-0.5px]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 6">
          <g id="Group">
            <path d="M0.5 6V0" id="Vector" opacity="0.2" stroke="var(--stroke-0, #F1F5F9)" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function Group20() {
  return (
    <div className="absolute inset-[71.43%_58.02%_26.43%_41.98%]" data-name="Group">
      <div className="absolute inset-[0_-0.5px]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 6">
          <g id="Group">
            <path d="M0.5 6V0" id="Vector" opacity="0.2" stroke="var(--stroke-0, #F1F5F9)" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function Group21() {
  return (
    <div className="absolute inset-[71.43%_53.95%_26.43%_46.05%]" data-name="Group">
      <div className="absolute inset-[0_-0.5px]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 6">
          <g id="Group">
            <path d="M0.5 6V0" id="Vector" opacity="0.2" stroke="var(--stroke-0, #F1F5F9)" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function Group22() {
  return (
    <div className="absolute inset-[71.43%_49.89%_26.43%_50.11%]" data-name="Group">
      <div className="absolute inset-[0_-0.5px]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 6">
          <g id="Group">
            <path d="M0.5 6V0" id="Vector" opacity="0.2" stroke="var(--stroke-0, #F1F5F9)" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function Group23() {
  return (
    <div className="absolute inset-[71.43%_45.82%_26.43%_54.18%]" data-name="Group">
      <div className="absolute inset-[0_-0.5px]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 6">
          <g id="Group">
            <path d="M0.5 6V0" id="Vector" opacity="0.2" stroke="var(--stroke-0, #F1F5F9)" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function Group24() {
  return (
    <div className="absolute inset-[71.43%_41.75%_26.43%_58.25%]" data-name="Group">
      <div className="absolute inset-[0_-0.5px]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 6">
          <g id="Group">
            <path d="M0.5 6V0" id="Vector" opacity="0.2" stroke="var(--stroke-0, #F1F5F9)" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function Group25() {
  return (
    <div className="absolute inset-[71.43%_37.68%_26.43%_62.32%]" data-name="Group">
      <div className="absolute inset-[0_-0.5px]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 6">
          <g id="Group">
            <path d="M0.5 6V0" id="Vector" opacity="0.2" stroke="var(--stroke-0, #F1F5F9)" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function Group26() {
  return (
    <div className="absolute inset-[71.43%_33.62%_26.43%_66.38%]" data-name="Group">
      <div className="absolute inset-[0_-0.5px]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 6">
          <g id="Group">
            <path d="M0.5 6V0" id="Vector" opacity="0.2" stroke="var(--stroke-0, #F1F5F9)" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function Group27() {
  return (
    <div className="absolute inset-[71.43%_29.55%_26.43%_70.45%]" data-name="Group">
      <div className="absolute inset-[0_-0.5px]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 6">
          <g id="Group">
            <path d="M0.5 6V0" id="Vector" opacity="0.2" stroke="var(--stroke-0, #F1F5F9)" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function Group28() {
  return (
    <div className="absolute inset-[71.43%_25.48%_26.43%_74.52%]" data-name="Group">
      <div className="absolute inset-[0_-0.5px]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 6">
          <g id="Group">
            <path d="M0.5 6V0" id="Vector" opacity="0.2" stroke="var(--stroke-0, #F1F5F9)" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function Group29() {
  return (
    <div className="absolute inset-[71.43%_21.41%_26.43%_78.59%]" data-name="Group">
      <div className="absolute inset-[0_-0.5px]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 6">
          <g id="Group">
            <path d="M0.5 6V0" id="Vector" opacity="0.2" stroke="var(--stroke-0, #F1F5F9)" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function Group30() {
  return (
    <div className="absolute inset-[71.43%_17.34%_26.43%_82.66%]" data-name="Group">
      <div className="absolute inset-[0_-0.5px]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 6">
          <g id="Group">
            <path d="M0.5 6V0" id="Vector" opacity="0.2" stroke="var(--stroke-0, #F1F5F9)" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function Group31() {
  return (
    <div className="absolute inset-[71.43%_13.28%_26.43%_86.72%]" data-name="Group">
      <div className="absolute inset-[0_-0.5px]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 6">
          <g id="Group">
            <path d="M0.5 6V0" id="Vector" opacity="0.2" stroke="var(--stroke-0, #F1F5F9)" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function Group32() {
  return (
    <div className="absolute inset-[71.43%_9.21%_26.43%_90.79%]" data-name="Group">
      <div className="absolute inset-[0_-0.5px]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 6">
          <g id="Group">
            <path d="M0.5 6V0" id="Vector" opacity="0.2" stroke="var(--stroke-0, #F1F5F9)" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function Group33() {
  return (
    <div className="absolute inset-[71.43%_5.14%_26.43%_94.86%]" data-name="Group">
      <div className="absolute inset-[0_-0.5px]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 6">
          <g id="Group">
            <path d="M0.5 6V0" id="Vector" opacity="0.2" stroke="var(--stroke-0, #F1F5F9)" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function Group34() {
  return (
    <div className="absolute inset-[71.43%_1.07%_26.43%_98.93%]" data-name="Group">
      <div className="absolute inset-[0_-0.5px]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 6">
          <g id="Group">
            <path d="M0.5 6V0" id="Vector" opacity="0.2" stroke="var(--stroke-0, #F1F5F9)" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function Group10() {
  return (
    <div className="absolute contents inset-[71.43%_1.07%_26.43%_5.37%]" data-name="Group">
      <Group11 />
      <Group12 />
      <Group13 />
      <Group14 />
      <Group15 />
      <Group16 />
      <Group17 />
      <Group18 />
      <Group19 />
      <Group20 />
      <Group21 />
      <Group22 />
      <Group23 />
      <Group24 />
      <Group25 />
      <Group26 />
      <Group27 />
      <Group28 />
      <Group29 />
      <Group30 />
      <Group31 />
      <Group32 />
      <Group33 />
      <Group34 />
    </div>
  );
}

function Group9() {
  return (
    <div className="absolute contents inset-[71.43%_1.07%_26.43%_5.37%]" data-name="Group">
      <Group10 />
    </div>
  );
}

function Group8() {
  return (
    <div className="absolute contents inset-[71.43%_1.07%_26.43%_5.37%]" data-name="Group">
      <div className="absolute inset-[71.43%_1.07%_28.57%_5.37%]" data-name="Vector">
        <div className="absolute inset-[-0.5px_0]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 871 1">
            <path d="M0 0.5H871" id="Vector" opacity="0.4" stroke="var(--stroke-0, #F1F5F9)" />
          </svg>
        </div>
      </div>
      <Group9 />
    </div>
  );
}

function Group38() {
  return (
    <div className="absolute inset-[3.57%_94.63%_96.43%_4.73%]" data-name="Group">
      <div className="absolute inset-[-0.5px_0]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6 1">
          <g id="Group">
            <path d="M0 0.5H6" id="Vector" opacity="0.2" stroke="var(--stroke-0, #F1F5F9)" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function Group39() {
  return (
    <div className="absolute inset-[22.08%_94.63%_77.92%_4.73%]" data-name="Group">
      <div className="absolute inset-[-0.5px_0]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6 1">
          <g id="Group">
            <path d="M0 0.5H6" id="Vector" opacity="0.2" stroke="var(--stroke-0, #F1F5F9)" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function Group40() {
  return (
    <div className="absolute inset-[40.58%_94.63%_59.42%_4.73%]" data-name="Group">
      <div className="absolute inset-[-0.5px_0]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6 1">
          <g id="Group">
            <path d="M0 0.5H6" id="Vector" opacity="0.2" stroke="var(--stroke-0, #F1F5F9)" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function Group41() {
  return (
    <div className="absolute inset-[59.09%_94.63%_40.91%_4.73%]" data-name="Group">
      <div className="absolute inset-[-0.5px_0]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6 1">
          <g id="Group">
            <path d="M0 0.5H6" id="Vector" opacity="0.2" stroke="var(--stroke-0, #F1F5F9)" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function Group42() {
  return (
    <div className="absolute inset-[71.43%_94.63%_28.57%_4.73%]" data-name="Group">
      <div className="absolute inset-[-0.5px_0]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6 1">
          <g id="Group">
            <path d="M0 0.5H6" id="Vector" opacity="0.2" stroke="var(--stroke-0, #F1F5F9)" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function Group37() {
  return (
    <div className="absolute contents inset-[3.57%_94.63%_28.57%_4.73%]" data-name="Group">
      <Group38 />
      <Group39 />
      <Group40 />
      <Group41 />
      <Group42 />
    </div>
  );
}

function Group36() {
  return (
    <div className="absolute contents inset-[3.57%_94.63%_28.57%_4.73%]" data-name="Group">
      <Group37 />
    </div>
  );
}

function Group35() {
  return (
    <div className="absolute contents inset-[3.57%_94.63%_28.57%_4.73%]" data-name="Group">
      <div className="absolute inset-[3.57%_94.63%_28.57%_5.37%]" data-name="Vector">
        <div className="absolute inset-[0_-0.5px]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 190">
            <path d="M0.5 0V190" id="Vector" opacity="0.4" stroke="var(--stroke-0, #F1F5F9)" />
          </svg>
        </div>
      </div>
      <Group36 />
    </div>
  );
}

function Group7() {
  return (
    <div className="absolute contents inset-[3.57%_1.07%_26.43%_4.73%]" data-name="Group">
      <Group8 />
      <Group35 />
    </div>
  );
}

function Group44() {
  return (
    <div className="absolute inset-[1.79%_0.54%_32.95%_4.83%]" data-name="Group">
      <div className="absolute inset-[-0.55%_-0.11%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 883 184.727">
          <g id="Group">
            <path d={svgPaths.p179c5980} fill="var(--fill-0, #FBBF24)" id="Vector" stroke="var(--stroke-0, #0F172A)" strokeWidth="2" />
            <path d={svgPaths.p163f2700} fill="var(--fill-0, #FBBF24)" id="Vector_2" stroke="var(--stroke-0, #0F172A)" strokeWidth="2" />
            <path d={svgPaths.p247b8800} fill="var(--fill-0, #FBBF24)" id="Vector_3" stroke="var(--stroke-0, #0F172A)" strokeWidth="2" />
            <path d={svgPaths.p1cd34a80} fill="var(--fill-0, #FBBF24)" id="Vector_4" stroke="var(--stroke-0, #0F172A)" strokeWidth="2" />
            <path d={svgPaths.p17785f00} fill="var(--fill-0, #FBBF24)" id="Vector_5" stroke="var(--stroke-0, #0F172A)" strokeWidth="2" />
            <path d={svgPaths.p233df800} fill="var(--fill-0, #FBBF24)" id="Vector_6" stroke="var(--stroke-0, #0F172A)" strokeWidth="2" />
            <path d={svgPaths.p1ddbe6c0} fill="var(--fill-0, #FBBF24)" id="Vector_7" stroke="var(--stroke-0, #0F172A)" strokeWidth="2" />
            <path d={svgPaths.p30591680} fill="var(--fill-0, #FBBF24)" id="Vector_8" stroke="var(--stroke-0, #0F172A)" strokeWidth="2" />
            <path d={svgPaths.p2d4dee00} fill="var(--fill-0, #FBBF24)" id="Vector_9" stroke="var(--stroke-0, #0F172A)" strokeWidth="2" />
            <path d={svgPaths.p25927300} fill="var(--fill-0, #FBBF24)" id="Vector_10" stroke="var(--stroke-0, #0F172A)" strokeWidth="2" />
            <path d={svgPaths.pd117040} fill="var(--fill-0, #FBBF24)" id="Vector_11" stroke="var(--stroke-0, #0F172A)" strokeWidth="2" />
            <path d={svgPaths.p10a04800} fill="var(--fill-0, #FBBF24)" id="Vector_12" stroke="var(--stroke-0, #0F172A)" strokeWidth="2" />
            <path d={svgPaths.p3a4bf600} fill="var(--fill-0, #FBBF24)" id="Vector_13" stroke="var(--stroke-0, #0F172A)" strokeWidth="2" />
            <path d={svgPaths.p15bb5872} fill="var(--fill-0, #FBBF24)" id="Vector_14" stroke="var(--stroke-0, #0F172A)" strokeWidth="2" />
            <path d={svgPaths.p1d42ae00} fill="var(--fill-0, #FBBF24)" id="Vector_15" stroke="var(--stroke-0, #0F172A)" strokeWidth="2" />
            <path d={svgPaths.pfd6b300} fill="var(--fill-0, #FBBF24)" id="Vector_16" stroke="var(--stroke-0, #0F172A)" strokeWidth="2" />
            <path d={svgPaths.p1ecab580} fill="var(--fill-0, #FBBF24)" id="Vector_17" stroke="var(--stroke-0, #0F172A)" strokeWidth="2" />
            <path d={svgPaths.pb8ec980} fill="var(--fill-0, #FBBF24)" id="Vector_18" stroke="var(--stroke-0, #0F172A)" strokeWidth="2" />
            <path d={svgPaths.p3e2abdc0} fill="var(--fill-0, #FBBF24)" id="Vector_19" stroke="var(--stroke-0, #0F172A)" strokeWidth="2" />
            <path d={svgPaths.p29de1270} fill="var(--fill-0, #FBBF24)" id="Vector_20" stroke="var(--stroke-0, #0F172A)" strokeWidth="2" />
            <path d={svgPaths.p30324480} fill="var(--fill-0, #FBBF24)" id="Vector_21" stroke="var(--stroke-0, #0F172A)" strokeWidth="2" />
            <path d={svgPaths.p2ef5d800} fill="var(--fill-0, #FBBF24)" id="Vector_22" stroke="var(--stroke-0, #0F172A)" strokeWidth="2" />
            <path d={svgPaths.p1b83de00} fill="var(--fill-0, #FBBF24)" id="Vector_23" stroke="var(--stroke-0, #0F172A)" strokeWidth="2" />
            <path d={svgPaths.p1e47600} fill="var(--fill-0, #FBBF24)" id="Vector_24" stroke="var(--stroke-0, #0F172A)" strokeWidth="2" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function Group43() {
  return (
    <div className="absolute contents inset-[1.79%_0.54%_32.95%_4.83%]" data-name="Group">
      <Group44 />
    </div>
  );
}

function Group47() {
  return (
    <div className="absolute contents inset-[73.48%_93.88%_13.89%_2.32%]" data-name="Group">
      <div className="absolute flex inset-[73.48%_93.88%_13.89%_2.32%] items-center justify-center">
        <div className="flex-none h-[13px] rotate-[315deg] w-[37px]">
          <p className="font-['Inter:Regular',sans-serif] font-normal leading-[normal] not-italic relative text-[#f1f5f9] text-[11px] text-right whitespace-pre">Week 1</p>
        </div>
      </div>
    </div>
  );
}

function Group48() {
  return (
    <div className="absolute contents inset-[73.48%_89.82%_13.39%_6.23%]" data-name="Group">
      <div className="absolute flex inset-[73.48%_89.82%_13.39%_6.23%] items-center justify-center">
        <div className="flex-none h-[13px] rotate-[315deg] w-[39px]">
          <p className="font-['Inter:Regular',sans-serif] font-normal leading-[normal] not-italic relative text-[#f1f5f9] text-[11px] text-right whitespace-pre">Week 2</p>
        </div>
      </div>
    </div>
  );
}

function Group49() {
  return (
    <div className="absolute contents inset-[73.48%_85.75%_13.39%_10.3%]" data-name="Group">
      <div className="absolute flex inset-[73.48%_85.75%_13.39%_10.3%] items-center justify-center">
        <div className="flex-none h-[13px] rotate-[315deg] w-[39px]">
          <p className="font-['Inter:Regular',sans-serif] font-normal leading-[normal] not-italic relative text-[#f1f5f9] text-[11px] text-right whitespace-pre">Week 3</p>
        </div>
      </div>
    </div>
  );
}

function Group50() {
  return (
    <div className="absolute contents inset-[73.48%_81.68%_13.39%_14.37%]" data-name="Group">
      <div className="absolute flex inset-[73.48%_81.68%_13.39%_14.37%] items-center justify-center">
        <div className="flex-none h-[13px] rotate-[315deg] w-[39px]">
          <p className="font-['Inter:Regular',sans-serif] font-normal leading-[normal] not-italic relative text-[#f1f5f9] text-[11px] text-right whitespace-pre">Week 4</p>
        </div>
      </div>
    </div>
  );
}

function Group51() {
  return (
    <div className="absolute contents inset-[73.48%_77.61%_13.39%_18.44%]" data-name="Group">
      <div className="absolute flex inset-[73.48%_77.61%_13.39%_18.44%] items-center justify-center">
        <div className="flex-none h-[13px] rotate-[315deg] w-[39px]">
          <p className="font-['Inter:Regular',sans-serif] font-normal leading-[normal] not-italic relative text-[#f1f5f9] text-[11px] text-right whitespace-pre">Week 5</p>
        </div>
      </div>
    </div>
  );
}

function Group52() {
  return (
    <div className="absolute contents inset-[73.48%_73.55%_13.39%_22.5%]" data-name="Group">
      <div className="absolute flex inset-[73.48%_73.55%_13.39%_22.5%] items-center justify-center">
        <div className="flex-none h-[13px] rotate-[315deg] w-[39px]">
          <p className="font-['Inter:Regular',sans-serif] font-normal leading-[normal] not-italic relative text-[#f1f5f9] text-[11px] text-right whitespace-pre">Week 6</p>
        </div>
      </div>
    </div>
  );
}

function Group53() {
  return (
    <div className="absolute contents inset-[73.48%_69.48%_13.39%_26.57%]" data-name="Group">
      <div className="absolute flex inset-[73.48%_69.48%_13.39%_26.57%] items-center justify-center">
        <div className="flex-none h-[13px] rotate-[315deg] w-[39px]">
          <p className="font-['Inter:Regular',sans-serif] font-normal leading-[normal] not-italic relative text-[#f1f5f9] text-[11px] text-right whitespace-pre">Week 7</p>
        </div>
      </div>
    </div>
  );
}

function Group54() {
  return (
    <div className="absolute contents inset-[73.48%_65.41%_13.39%_30.64%]" data-name="Group">
      <div className="absolute flex inset-[73.48%_65.41%_13.39%_30.64%] items-center justify-center">
        <div className="flex-none h-[13px] rotate-[315deg] w-[39px]">
          <p className="font-['Inter:Regular',sans-serif] font-normal leading-[normal] not-italic relative text-[#f1f5f9] text-[11px] text-right whitespace-pre">Week 8</p>
        </div>
      </div>
    </div>
  );
}

function Group55() {
  return (
    <div className="absolute contents inset-[73.48%_61.34%_13.39%_34.71%]" data-name="Group">
      <div className="absolute flex inset-[73.48%_61.34%_13.39%_34.71%] items-center justify-center">
        <div className="flex-none h-[13px] rotate-[315deg] w-[39px]">
          <p className="font-['Inter:Regular',sans-serif] font-normal leading-[normal] not-italic relative text-[#f1f5f9] text-[11px] text-right whitespace-pre">Week 9</p>
        </div>
      </div>
    </div>
  );
}

function Group56() {
  return (
    <div className="absolute contents inset-[73.48%_57.28%_12.13%_38.4%]" data-name="Group">
      <div className="absolute flex inset-[73.48%_57.28%_12.13%_38.4%] items-center justify-center">
        <div className="flex-none h-[13px] rotate-[315deg] w-[44px]">
          <p className="font-['Inter:Regular',sans-serif] font-normal leading-[normal] not-italic relative text-[#f1f5f9] text-[11px] text-right whitespace-pre">Week 10</p>
        </div>
      </div>
    </div>
  );
}

function Group57() {
  return (
    <div className="absolute contents inset-[73.48%_53.21%_12.63%_42.61%]" data-name="Group">
      <div className="absolute flex inset-[73.48%_53.21%_12.63%_42.61%] items-center justify-center">
        <div className="flex-none h-[13px] rotate-[315deg] w-[42px]">
          <p className="font-['Inter:Regular',sans-serif] font-normal leading-[normal] not-italic relative text-[#f1f5f9] text-[11px] text-right whitespace-pre">Week 11</p>
        </div>
      </div>
    </div>
  );
}

function Group58() {
  return (
    <div className="absolute contents inset-[73.48%_49.14%_12.13%_46.53%]" data-name="Group">
      <div className="absolute flex inset-[73.48%_49.14%_12.13%_46.53%] items-center justify-center">
        <div className="flex-none h-[13px] rotate-[315deg] w-[44px]">
          <p className="font-['Inter:Regular',sans-serif] font-normal leading-[normal] not-italic relative text-[#f1f5f9] text-[11px] text-right whitespace-pre">Week 12</p>
        </div>
      </div>
    </div>
  );
}

function Group59() {
  return (
    <div className="absolute contents inset-[73.48%_45.07%_12.13%_50.6%]" data-name="Group">
      <div className="absolute flex inset-[73.48%_45.07%_12.13%_50.6%] items-center justify-center">
        <div className="flex-none h-[13px] rotate-[315deg] w-[44px]">
          <p className="font-['Inter:Regular',sans-serif] font-normal leading-[normal] not-italic relative text-[#f1f5f9] text-[11px] text-right whitespace-pre">Week 13</p>
        </div>
      </div>
    </div>
  );
}

function Group60() {
  return (
    <div className="absolute contents inset-[73.48%_41.01%_12.13%_54.67%]" data-name="Group">
      <div className="absolute flex inset-[73.48%_41.01%_12.13%_54.67%] items-center justify-center">
        <div className="flex-none h-[13px] rotate-[315deg] w-[44px]">
          <p className="font-['Inter:Regular',sans-serif] font-normal leading-[normal] not-italic relative text-[#f1f5f9] text-[11px] text-right whitespace-pre">Week 14</p>
        </div>
      </div>
    </div>
  );
}

function Group61() {
  return (
    <div className="absolute contents inset-[73.48%_36.94%_12.13%_58.73%]" data-name="Group">
      <div className="absolute flex inset-[73.48%_36.94%_12.13%_58.73%] items-center justify-center">
        <div className="flex-none h-[13px] rotate-[315deg] w-[44px]">
          <p className="font-['Inter:Regular',sans-serif] font-normal leading-[normal] not-italic relative text-[#f1f5f9] text-[11px] text-right whitespace-pre">Week 15</p>
        </div>
      </div>
    </div>
  );
}

function Group62() {
  return (
    <div className="absolute contents inset-[73.48%_32.87%_12.13%_62.8%]" data-name="Group">
      <div className="absolute flex inset-[73.48%_32.87%_12.13%_62.8%] items-center justify-center">
        <div className="flex-none h-[13px] rotate-[315deg] w-[44px]">
          <p className="font-['Inter:Regular',sans-serif] font-normal leading-[normal] not-italic relative text-[#f1f5f9] text-[11px] text-right whitespace-pre">Week 16</p>
        </div>
      </div>
    </div>
  );
}

function Group63() {
  return (
    <div className="absolute contents inset-[73.48%_28.8%_12.13%_66.87%]" data-name="Group">
      <div className="absolute flex inset-[73.48%_28.8%_12.13%_66.87%] items-center justify-center">
        <div className="flex-none h-[13px] rotate-[315deg] w-[44px]">
          <p className="font-['Inter:Regular',sans-serif] font-normal leading-[normal] not-italic relative text-[#f1f5f9] text-[11px] text-right whitespace-pre">Week 17</p>
        </div>
      </div>
    </div>
  );
}

function Group64() {
  return (
    <div className="absolute contents inset-[73.48%_24.73%_12.13%_70.94%]" data-name="Group">
      <div className="absolute flex inset-[73.48%_24.73%_12.13%_70.94%] items-center justify-center">
        <div className="flex-none h-[13px] rotate-[315deg] w-[44px]">
          <p className="font-['Inter:Regular',sans-serif] font-normal leading-[normal] not-italic relative text-[#f1f5f9] text-[11px] text-right whitespace-pre">Week 18</p>
        </div>
      </div>
    </div>
  );
}

function Group65() {
  return (
    <div className="absolute bottom-[12.13%] contents left-3/4 right-[20.67%] top-[73.48%]" data-name="Group">
      <div className="absolute bottom-[12.13%] flex items-center justify-center left-3/4 right-[20.67%] top-[73.48%]">
        <div className="flex-none h-[13px] rotate-[315deg] w-[44px]">
          <p className="font-['Inter:Regular',sans-serif] font-normal leading-[normal] not-italic relative text-[#f1f5f9] text-[11px] text-right whitespace-pre">Week 19</p>
        </div>
      </div>
    </div>
  );
}

function Group66() {
  return (
    <div className="absolute contents inset-[73.48%_16.6%_11.62%_78.92%]" data-name="Group">
      <div className="absolute flex inset-[73.48%_16.6%_11.62%_78.92%] items-center justify-center">
        <div className="flex-none h-[13px] rotate-[315deg] w-[46px]">
          <p className="font-['Inter:Regular',sans-serif] font-normal leading-[normal] not-italic relative text-[#f1f5f9] text-[11px] text-right whitespace-pre">Week 20</p>
        </div>
      </div>
    </div>
  );
}

function Group67() {
  return (
    <div className="absolute contents inset-[73.48%_12.53%_12.13%_83.14%]" data-name="Group">
      <div className="absolute flex inset-[73.48%_12.53%_12.13%_83.14%] items-center justify-center">
        <div className="flex-none h-[13px] rotate-[315deg] w-[44px]">
          <p className="font-['Inter:Regular',sans-serif] font-normal leading-[normal] not-italic relative text-[#f1f5f9] text-[11px] text-right whitespace-pre">Week 21</p>
        </div>
      </div>
    </div>
  );
}

function Group68() {
  return (
    <div className="absolute contents inset-[73.48%_8.46%_11.62%_87.05%]" data-name="Group">
      <div className="absolute flex inset-[73.48%_8.46%_11.62%_87.05%] items-center justify-center">
        <div className="flex-none h-[13px] rotate-[315deg] w-[46px]">
          <p className="font-['Inter:Regular',sans-serif] font-normal leading-[normal] not-italic relative text-[#f1f5f9] text-[11px] text-right whitespace-pre">Week 22</p>
        </div>
      </div>
    </div>
  );
}

function Group69() {
  return (
    <div className="absolute contents inset-[73.48%_4.4%_11.62%_91.12%]" data-name="Group">
      <div className="absolute flex inset-[73.48%_4.4%_11.62%_91.12%] items-center justify-center">
        <div className="flex-none h-[13px] rotate-[315deg] w-[46px]">
          <p className="font-['Inter:Regular',sans-serif] font-normal leading-[normal] not-italic relative text-[#f1f5f9] text-[11px] text-right whitespace-pre">Week 23</p>
        </div>
      </div>
    </div>
  );
}

function Group70() {
  return (
    <div className="absolute contents inset-[73.48%_0.51%_11.62%_95.01%]" data-name="Group">
      <div className="absolute flex inset-[73.48%_0.51%_11.62%_95.01%] items-center justify-center">
        <div className="flex-none h-[13px] rotate-[315deg] w-[46px]">
          <p className="font-['Inter:Regular',sans-serif] font-normal leading-[normal] not-italic relative text-[#f1f5f9] text-[11px] text-right whitespace-pre">Week 24</p>
        </div>
      </div>
    </div>
  );
}

function Group46() {
  return (
    <div className="absolute contents inset-[73.48%_0.51%_11.62%_2.32%]" data-name="Group">
      <Group47 />
      <Group48 />
      <Group49 />
      <Group50 />
      <Group51 />
      <Group52 />
      <Group53 />
      <Group54 />
      <Group55 />
      <Group56 />
      <Group57 />
      <Group58 />
      <Group59 />
      <Group60 />
      <Group61 />
      <Group62 />
      <Group63 />
      <Group64 />
      <Group65 />
      <Group66 />
      <Group67 />
      <Group68 />
      <Group69 />
      <Group70 />
    </div>
  );
}

function Group72() {
  return (
    <div className="absolute contents inset-[1.04%_95.49%_94.32%_3.11%]" data-name="Group">
      <p className="absolute font-['Inter:Regular',sans-serif] font-normal inset-[1.04%_95.49%_94.32%_3.11%] leading-[normal] not-italic text-[#f1f5f9] text-[11px] text-right whitespace-pre">#1</p>
    </div>
  );
}

function Group73() {
  return (
    <div className="absolute contents inset-[19.54%_95.49%_75.81%_3.01%]" data-name="Group">
      <p className="absolute font-['Inter:Regular',sans-serif] font-normal inset-[19.54%_95.49%_75.81%_3.01%] leading-[normal] not-italic text-[#f1f5f9] text-[11px] text-right whitespace-pre">#7</p>
    </div>
  );
}

function Group74() {
  return (
    <div className="absolute contents inset-[38.05%_95.49%_57.31%_2.36%]" data-name="Group">
      <p className="absolute font-['Inter:Regular',sans-serif] font-normal inset-[38.05%_95.49%_57.31%_2.36%] leading-[normal] not-italic text-[#f1f5f9] text-[11px] text-right whitespace-pre">#13</p>
    </div>
  );
}

function Group75() {
  return (
    <div className="absolute contents inset-[56.56%_95.49%_38.8%_2.47%]" data-name="Group">
      <p className="absolute font-['Inter:Regular',sans-serif] font-normal inset-[56.56%_95.49%_38.8%_2.47%] leading-[normal] not-italic text-[#f1f5f9] text-[11px] text-right whitespace-pre">#19</p>
    </div>
  );
}

function Group76() {
  return (
    <div className="absolute contents inset-[68.89%_95.49%_26.46%_2.26%]" data-name="Group">
      <p className="absolute font-['Inter:Regular',sans-serif] font-normal inset-[68.89%_95.49%_26.46%_2.26%] leading-[normal] not-italic text-[#f1f5f9] text-[11px] text-right whitespace-pre">#23</p>
    </div>
  );
}

function Group71() {
  return (
    <div className="absolute contents inset-[1.04%_95.49%_26.46%_2.26%]" data-name="Group">
      <Group72 />
      <Group73 />
      <Group74 />
      <Group75 />
      <Group76 />
    </div>
  );
}

function Group45() {
  return (
    <div className="absolute contents inset-[1.04%_0.51%_11.62%_2.26%]" data-name="Group">
      <Group46 />
      <Group71 />
    </div>
  );
}

function Icon3() {
  return (
    <div className="absolute h-[280px] left-0 overflow-clip top-0 w-[931px]" data-name="Icon">
      <Group />
      <Group4 />
      <Group7 />
      <Group43 />
      <Group45 />
    </div>
  );
}

function Container15() {
  return (
    <div className="h-[280px] relative shrink-0 w-full" data-name="Container">
      <Icon3 />
    </div>
  );
}

export default function RankEvolutionChart() {
  return (
    <div className="bg-[#1e293b] content-stretch flex flex-col gap-[24px] items-start pb-px pt-[25px] px-[25px] relative rounded-[10px] size-full" data-name="RankEvolutionChart">
      <div aria-hidden="true" className="absolute border border-[#334155] border-solid inset-0 pointer-events-none rounded-[10px] shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-2px_rgba(0,0,0,0.1)]" />
      <Container />
      <Container15 />
    </div>
  );
}