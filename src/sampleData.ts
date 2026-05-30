import { PuzzlePair } from './types';

export const MATH_SAMPLE_DATA: PuzzlePair[] = [
  {
    id: 'math-1',
    question: 'Đạo hàm của hàm số $y = 2^x$ là:',
    answer: "$y' = 2^x \\cdot \\ln(2)$",
    code: 'A1'
  },
  {
    id: 'math-2',
    question: 'Tập xác định của $y = \\log_2(x - 1)$ là:',
    answer: '$D = (1; +\\infty)$',
    code: 'B2'
  },
  {
    id: 'math-3',
    question: 'Nghiệm phương trình $\\log_3(x) = 2$ là:',
    answer: '$x = 9$',
    code: 'C3'
  },
  {
    id: 'math-4',
    question: 'Nghiệm phương trình $2^{x - 1} = 8$ là:',
    answer: '$x = 4$',
    code: 'D4'
  },
  {
    id: 'math-5',
    question: 'Đạo hàm của hàm số $y = \\ln(x)$ là:',
    answer: "$y' = \\frac{1}{x}$",
    code: 'E5'
  },
  {
    id: 'math-6',
    question: 'Tính giá trị biểu thức $\\log_a(a^3)$:',
    answer: '$3$',
    code: 'F6'
  },
  {
    id: 'math-7',
    question: 'Đồ thị $y = a^x$ đi qua điểm cố định nào?',
    answer: '$(0; 1)$',
    code: 'G7'
  },
  {
    id: 'math-8',
    question: 'Hàm số $y = \\log_a(x)\\ (0 < a \\neq 1)$ đồng biến khi:',
    answer: '$a > 1$',
    code: 'H8'
  }
];

export const GEOGRAPHY_SAMPLE_DATA: PuzzlePair[] = [
  {
    id: 'geo-1',
    question: 'Thủ đô của Việt Nam là?',
    answer: 'Hà Nội',
    code: 'V1'
  },
  {
    id: 'geo-2',
    question: 'Sông dài nhất chảy qua lãnh thổ Việt Nam?',
    answer: 'Sông Mê Kông',
    code: 'V2'
  },
  {
    id: 'geo-3',
    question: 'Đỉnh núi cao nhất Việt Nam?',
    answer: 'Fansipan (3.143m)',
    code: 'V3'
  },
  {
    id: 'geo-4',
    question: 'Quần đảo Hoàng Sa thuộc tỉnh/thành phố nào?',
    answer: 'Thành phố Đà Nẵng',
    code: 'V4'
  },
  {
    id: 'geo-5',
    question: 'Tỉnh có diện tích lớn nhất nước ta?',
    answer: 'Nghệ An',
    code: 'V5'
  }
];

export const ENGLISH_SAMPLE_DATA: PuzzlePair[] = [
  {
    id: 'eng-1',
    question: 'Past simple of "go" is:',
    answer: 'went',
    code: 'E1'
  },
  {
    id: 'eng-2',
    question: 'Opposite of "heavy" is:',
    answer: 'light',
    code: 'E2'
  },
  {
    id: 'eng-3',
    question: 'Synonym of "beautiful":',
    answer: 'gorgeous',
    code: 'E3'
  },
  {
    id: 'eng-4',
    question: 'What is the comparative of "good"?',
    answer: 'better',
    code: 'E4'
  }
];
