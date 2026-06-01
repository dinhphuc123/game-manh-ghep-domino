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

export const FRACTION_SAMPLE_DATA: PuzzlePair[] = [
  { id: 'frac-1', question: 'Rút gọn phân số $\\frac{12}{18}$:', answer: '$\\frac{2}{3}$', code: 'F1' },
  { id: 'frac-2', question: 'Rút gọn phân số $\\frac{15}{25}$:', answer: '$\\frac{3}{5}$', code: 'F2' },
  { id: 'frac-3', question: 'Rút gọn phân số $\\frac{8}{24}$:', answer: '$\\frac{1}{3}$', code: 'F3' },
  { id: 'frac-4', question: 'Rút gọn phân số $\\frac{14}{21}$:', answer: '$\\frac{2}{3}$', code: 'F4' },
  { id: 'frac-5', question: 'Rút gọn phân số $\\frac{16}{20}$:', answer: '$\\frac{4}{5}$', code: 'F5' },
  { id: 'frac-6', question: 'Rút gọn phân số $\\frac{18}{27}$:', answer: '$\\frac{2}{3}$', code: 'F6' },
  { id: 'frac-7', question: 'Rút gọn phân số $\\frac{20}{30}$:', answer: '$\\frac{2}{3}$', code: 'F7' },
  { id: 'frac-8', question: 'Rút gọn phân số $\\frac{9}{12}$:', answer: '$\\frac{3}{4}$', code: 'F8' },
  { id: 'frac-9', question: 'Rút gọn phân số $\\frac{6}{8}$:', answer: '$\\frac{3}{4}$', code: 'F9' },
  { id: 'frac-10', question: 'Rút gọn phân số $\\frac{10}{15}$:', answer: '$\\frac{2}{3}$', code: 'F10' },
  { id: 'frac-11', question: 'Rút gọn phân số $\\frac{12}{16}$:', answer: '$\\frac{3}{4}$', code: 'F11' },
  { id: 'frac-12', question: 'Rút gọn phân số $\\frac{15}{20}$:', answer: '$\\frac{3}{4}$', code: 'F12' }
];

export const EQUATION_SAMPLE_DATA: PuzzlePair[] = [
  { id: 'eq-1', question: 'Tìm $x$ biết: $x + 5 = 12$', answer: '$x = 7$', code: 'Q1' },
  { id: 'eq-2', question: 'Tìm $x$ biết: $2x - 3 = 7$', answer: '$x = 5$', code: 'Q2' },
  { id: 'eq-3', question: 'Tìm $x$ biết: $3x + 4 = 19$', answer: '$x = 5$', code: 'Q3' },
  { id: 'eq-4', question: 'Tìm $x$ biết: $x - 8 = -2$', answer: '$x = 6$', code: 'Q4' },
  { id: 'eq-5', question: 'Tìm $x$ biết: $4x = 24$', answer: '$x = 6$', code: 'Q5' },
  { id: 'eq-6', question: 'Tìm $x$ biết: $5x + 2 = 17$', answer: '$x = 3$', code: 'Q6' },
  { id: 'eq-7', question: 'Tìm $x$ biết: $2x + 8 = 16$', answer: '$x = 4$', code: 'Q7' },
  { id: 'eq-8', question: 'Tìm $x$ biết: $x / 3 = 4$', answer: '$x = 12$', code: 'Q8' },
  { id: 'eq-9', question: 'Tìm $x$ biết: $3x - 5 = 10$', answer: '$x = 5$', code: 'Q9' },
  { id: 'eq-10', question: 'Tìm $x$ biết: $7x + 1 = 15$', answer: '$x = 2$', code: 'Q10' },
  { id: 'eq-11', question: 'Tìm $x$ biết: $6x - 4 = 20$', answer: '$x = 4$', code: 'Q11' },
  { id: 'eq-12', question: 'Tìm $x$ biết: $x + 9 = 15$', answer: '$x = 6$', code: 'Q12' }
];

export const INEQUALITY_SAMPLE_DATA: PuzzlePair[] = [
  { id: 'ineq-1', question: 'Giải bất phương trình: $x - 3 > 5$', answer: '$x > 8$', code: 'I1' },
  { id: 'ineq-2', question: 'Giải bất phương trình: $2x < 10$', answer: '$x < 5$', code: 'I2' },
  { id: 'ineq-3', question: 'Giải bất phương trình: $3x + 1 \\geq 7$', answer: '$x \\geq 2$', code: 'I3' },
  { id: 'ineq-4', question: 'Giải bất phương trình: $x + 4 \\leq 9$', answer: '$x \\leq 5$', code: 'I4' },
  { id: 'ineq-5', question: 'Giải bất phương trình: $5x - 2 > 13$', answer: '$x > 3$', code: 'I5' },
  { id: 'ineq-6', question: 'Giải bất phương trình: $-2x < 8$', answer: '$x > -4$', code: 'I6' },
  { id: 'ineq-7', question: 'Giải bất phương trình: $x / 2 \\geq -3$', answer: '$x \\geq -6$', code: 'I7' },
  { id: 'ineq-8', question: 'Giải bất phương trình: $4x - 5 \\leq 11$', answer: '$x \\leq 4$', code: 'I8' },
  { id: 'ineq-9', question: 'Giải bất phương trình: $3x > -9$', answer: '$x > -3$', code: 'I9' },
  { id: 'ineq-10', question: 'Giải bất phương trình: $x + 7 < 4$', answer: '$x < -3$', code: 'I10' },
  { id: 'ineq-11', question: 'Giải bất phương trình: $-3x \\geq 9$', answer: '$x \\leq -3$', code: 'I11' },
  { id: 'ineq-12', question: 'Giải bất phương trình: $2x - 1 \\leq 5$', answer: '$x \\leq 3$', code: 'I12' }
];

export const DISTRIBUTIVE_SAMPLE_DATA: PuzzlePair[] = [
  { id: 'dist-1', question: 'Khai triển: $2(x + 3)$', answer: '$2x + 6$', code: 'D1' },
  { id: 'dist-2', question: 'Khai triển: $3(x - 4)$', answer: '$3x - 12$', code: 'D2' },
  { id: 'dist-3', question: 'Khai triển: $5(2x + 1)$', answer: '$10x + 5$', code: 'D3' },
  { id: 'dist-4', question: 'Khai triển: $4(3x - 2)$', answer: '$12x - 8$', code: 'D4' },
  { id: 'dist-5', question: 'Khai triển: $-2(x - 5)$', answer: '$-2x + 10$', code: 'D5' },
  { id: 'dist-6', question: 'Khai triển: $x(y + 2)$', answer: '$xy + 2x$', code: 'D6' },
  { id: 'dist-7', question: 'Khai triển: $3(2x + 4)$', answer: '$6x + 12$', code: 'D7' },
  { id: 'dist-8', question: 'Khai triển: $5(x - 3)$', answer: '$5x - 15$', code: 'D8' },
  { id: 'dist-9', question: 'Khai triển: $-3(2x - 1)$', answer: '$-6x + 3$', code: 'D9' },
  { id: 'dist-10', question: 'Khai triển: $4(x + 5)$', answer: '$4x + 20$', code: 'D10' },
  { id: 'dist-11', question: 'Khai triển: $2(3x - 4)$', answer: '$6x - 8$', code: 'D11' },
  { id: 'dist-12', question: 'Khai triển: $6(x + 2)$', answer: '$6x + 12$', code: 'D12' }
];
