import unittest
from ai_pipeline.utils.ai_enhancements import AIEnhancements

class TestSalaryParsing(unittest.TestCase):
    def test_space_separated_thousands(self):
        """Test that R4 900 is parsed as 4900, not 4."""
        result = AIEnhancements.parse("R4 900 per month")
        self.assertEqual(result.salary_min, 4900)
        self.assertEqual(result.salary_type, "monthly")

    def test_standard_formats(self):
        """Test standard R15,000 formats."""
        result = AIEnhancements.parse("R15,000")
        self.assertEqual(result.salary_min, 15000)
    
    def test_range_formats(self):
        """Test ranges like R15k - R20k."""
        result = AIEnhancements.parse("R15k - R20k")
        self.assertEqual(result.salary_min, 15000)
        self.assertEqual(result.salary_max, 20000)

    def test_per_annum(self):
        """Test annual salaries."""
        result = AIEnhancements.parse("R180 000 per annum")
        # 180000 / 12 = 15000
        self.assertEqual(result.salary_min, 15000)
        self.assertEqual(result.salary_type, "annual")

if __name__ == '__main__':
    unittest.main()
