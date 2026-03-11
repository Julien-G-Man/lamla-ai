import {
  Mail,
  MessageCircle,
  HelpCircle,
  MessageSquare,
  Send,
  AtSign,
  Phone,
  Inbox,
  MailOpen,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type Tier = 'low' | 'mid' | 'high';
type Motion = 'vertical' | 'drift' | 'orbit' | 'swing' | 'ball';

const tierClass: Record<Tier, string> = {
  low:  'opacity-[0.20] dark:opacity-[0.18]',
  mid:  'opacity-[0.28] dark:opacity-[0.22]',
  high: 'opacity-[0.36] dark:opacity-[0.30]',
};

const blurClass: Record<0 | 1 | 2, string> = {
  0: '',
  1: 'blur-[1px]',
  2: 'blur-[1px]',
};

const motionConfig: Record<Motion, { name: string; easing: string; direction?: React.CSSProperties['animationDirection'] }> = {
  vertical: { name: 'float-up-down',    easing: 'ease-in-out' },
  drift:    { name: 'float-drift',      easing: 'ease-in-out' },
  orbit:    { name: 'float-orbit',      easing: 'linear' },
  swing:    { name: 'float-swing',      easing: 'ease-in-out' },
  ball:     { name: 'float-ball-path',  easing: 'cubic-bezier(0.35, 0, 0.65, 1)', direction: 'alternate' },
};

type IconItem = {
  type: 'icon';
  Icon: LucideIcon;
  size: number;
  top: number;
  left: number;
  tier: Tier;
  blur: 0 | 1 | 2;
  motion: Motion;
  duration: number;
  delay: number;
};

type TextItem = {
  type: 'text';
  symbol: string;
  fontSize: number;
  top: number;
  left: number;
  tier: Tier;
  blur: 0 | 1 | 2;
  motion: Motion;
  duration: number;
  delay: number;
};

type FloatItem = IconItem | TextItem;

const items: FloatItem[] = [
  // Icons
  { type: 'icon', Icon: Mail,          size: 34, top:  8, left:  7, tier: 'mid',  blur: 1, motion: 'ball',     duration:  8.0, delay: 0.0 },
  { type: 'icon', Icon: MessageCircle, size: 62, top: 22, left: 88, tier: 'high', blur: 2, motion: 'ball',     duration:  9.0, delay: 1.0 },
  { type: 'icon', Icon: HelpCircle,    size: 38, top: 68, left:  4, tier: 'high', blur: 1, motion: 'drift',    duration:  8.0, delay: 2.0 },
  { type: 'icon', Icon: MessageSquare, size: 30, top: 58, left: 93, tier: 'mid',  blur: 1, motion: 'drift',    duration: 10.0, delay: 0.5 },
  { type: 'icon', Icon: Send,          size: 36, top: 38, left: 14, tier: 'mid',  blur: 1, motion: 'ball',     duration:  9.5, delay: 3.0 },
  { type: 'icon', Icon: AtSign,        size: 32, top: 82, left: 76, tier: 'mid',  blur: 1, motion: 'swing',    duration:  7.5, delay: 1.5 },
  { type: 'icon', Icon: Phone,         size: 40, top: 12, left: 62, tier: 'low',  blur: 2, motion: 'orbit',    duration: 11.0, delay: 2.5 },
  { type: 'icon', Icon: Inbox,         size: 46, top: 52, left: 48, tier: 'low',  blur: 2, motion: 'drift',    duration: 12.0, delay: 4.0 },
  { type: 'icon', Icon: MailOpen,      size: 34, top: 86, left: 28, tier: 'mid',  blur: 1, motion: 'vertical', duration:  8.5, delay: 1.0 },
  { type: 'icon', Icon: HelpCircle,    size: 28, top: 64, left: 22, tier: 'mid',  blur: 1, motion: 'ball',     duration:  7.8, delay: 2.0 },
  { type: 'icon', Icon: Mail,          size: 26, top: 30, left: 72, tier: 'low',  blur: 2, motion: 'swing',    duration:  9.5, delay: 3.5 },
  { type: 'icon', Icon: MessageCircle, size: 30, top: 75, left: 55, tier: 'low',  blur: 2, motion: 'drift',    duration: 10.5, delay: 0.8 },
  // Text symbols
  { type: 'text', symbol: '?',  fontSize: 44, top: 18, left: 32, tier: 'high', blur: 0, motion: 'vertical', duration:  7.0, delay: 0.8 },
  { type: 'text', symbol: '✉',  fontSize: 40, top: 44, left: 80, tier: 'mid',  blur: 1, motion: 'ball',     duration:  9.0, delay: 2.0 },
  { type: 'text', symbol: '?',  fontSize: 36, top: 72, left: 57, tier: 'high', blur: 0, motion: 'drift',    duration:  6.5, delay: 1.2 },
  { type: 'text', symbol: '@',  fontSize: 34, top: 28, left: 50, tier: 'mid',  blur: 1, motion: 'orbit',    duration:  8.0, delay: 3.5 },
  { type: 'text', symbol: '💬', fontSize: 36, top: 90, left: 42, tier: 'mid',  blur: 1, motion: 'swing',    duration: 10.0, delay: 1.8 },
  { type: 'text', symbol: '!',  fontSize: 38, top: 50, left:  3, tier: 'mid',  blur: 0, motion: 'ball',     duration:  8.5, delay: 2.8 },
];

export default function FloatingContactIcons() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {items.map((item, i) => {
        const motion = motionConfig[item.motion];
        const className = cn(
          'absolute select-none will-change-transform',
          'text-gray-700 dark:text-gray-300',
          tierClass[item.tier],
          blurClass[item.blur],
        );

        const animStyle: React.CSSProperties = {
          top:                    `${item.top}%`,
          left:                   `${item.left}%`,
          animationName:          motion.name,
          animationDuration:      `${item.duration}s`,
          animationTimingFunction: motion.easing,
          animationIterationCount: 'infinite',
          animationDirection:     motion.direction ?? 'normal',
          animationDelay:         `${item.delay}s`,
        };

        if (item.type === 'icon') {
          return (
            <div key={i} className={className} style={animStyle}>
              <item.Icon size={item.size} strokeWidth={1.5} />
            </div>
          );
        }

        return (
          <div
            key={i}
            className={className}
            style={{ ...animStyle, fontSize: item.fontSize, fontWeight: 300, lineHeight: 1, fontFamily: 'Georgia, serif' }}
          >
            {item.symbol}
          </div>
        );
      })}
    </div>
  );
}
