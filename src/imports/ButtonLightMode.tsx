import svgPaths from "./svg-8m7ei09a28";

function Telephone() {
  return (
    <div className="absolute left-0 size-[24px] top-0" data-name="telephone">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="telephone">
          <path d={svgPaths.p3b13ce00} id="Icon" stroke="var(--stroke-0, #F0F3FF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
        </g>
      </svg>
    </div>
  );
}

function LeftIcon() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="left-icon">
      <Telephone />
    </div>
  );
}

function RightIcon() {
  return <div className="shrink-0 size-[24px]" data-name="right-icon" />;
}

export default function ButtonLightMode() {
  return (
    <div className="bg-[rgba(255,255,255,0.2)] relative rounded-[32px] size-full" data-name="Button / Light mode">
      <div aria-hidden="true" className="absolute border-[1.4px] border-solid border-white inset-[-1.4px] pointer-events-none rounded-[33.4px]" />
      <div className="flex flex-row items-center justify-center size-full">
        <div className="box-border content-stretch flex gap-[12px] items-center justify-center p-[16px] relative size-full">
          <LeftIcon />
          <div className="basis-0 flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold grow justify-center leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#f0f3ff] text-[16px] text-center">
            <p className="leading-[1.4]">Phone Sign Up</p>
          </div>
          <RightIcon />
        </div>
      </div>
    </div>
  );
}