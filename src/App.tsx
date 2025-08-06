import { useState, useRef,type ReactNode } from 'react'
import 'App.css'
import { PercentageDisplay, MoneyDisplay, Modal } from 'shared/Components'
import Decimal from 'decimal.js'
import { Form, Divider, Row, Col, Card, Flex } from 'antd';
import type { 
  IncomeState,
} from 'domains/Tax/Hooks';
import {
  useSalarySection,
  useCommissionSection,
  useRoyaltySection,
  useYieldIncomeSection,
  useRentalSection,
  useOtherSection,
  useFamilialTaxDeduction,
  useRetirementTaxDeduction,
  useInsuranceTaxDeduction,
  useOtherTaxDeduction,
  useDonation,
  useTaxCalculation,

  royaltyIncomeSection,
  materialsAndLaborIncomeSection,
  rentalKinds,
  liberalProfessionKinds,
} from 'domains/Tax/Hooks';
import {
  SalarySection,
  CommissionSection,
  RoyaltySection,
  YieldIncomeSection,
  RentalSection,
  OtherSection,
  FamilialTaxDeduction,
  RetirementTaxDeduction,
  InsuranceTaxDeduction,
  OtherTaxDeduction,
  Donation,
  TaxCalculation,
} from 'domains/Tax/Components/Sections';

const mainSpan = 8
const topSummarySpan = 4
const span = 24

function App() {
  interface ModalState {
    open: boolean
    content: ReactNode
  }

  const [modalState, setModalState] = useState<ModalState>({ open: false, content: null })
  const gutter = 16
  function openModal(content: ReactNode[]){
    setModalState({ open: true, content })
  }

  const incomeState: IncomeState = {
    salaryIncome: useState(new Decimal(0)),

    commissionIncome: useState(new Decimal(0)),

    royaltyIncome: useState(new Decimal(0)),

    yieldIncomeRef: useRef<Decimal>(new Decimal(0)),

    rentalIncomeRef: useRef<Decimal>(new Decimal(0)),

    liberalProfessionIncomeRef: useRef<Decimal>(new Decimal(0)),

    materialsAndLaborIncome: useState(new Decimal(0)),

    otherIncome: useState(new Decimal(0)),

    salaryExpenseRef: useRef<Decimal>(new Decimal(0)),
    commissionExpenseRef: useRef<Decimal>(new Decimal(0)),
  }

  const salarySection = useSalarySection({ incomeState})

  const commissionSection = useCommissionSection({
    incomeState,
    accumulatedIncomeAmount: salarySection.accumulatedIncomeAmount,
    accumulatedWithheldTaxAmount: salarySection.accumulatedWithheldTaxAmount,
    accumulatedExpenseAmount: salarySection.accumulatedExpenseAmount,
  })
  
  const royaltySection = useRoyaltySection({
    incomeSection: royaltyIncomeSection,
    incomeState,
    accumulatedIncomeAmount: commissionSection.accumulatedIncomeAmount,
    accumulatedWithheldTaxAmount: commissionSection.accumulatedWithheldTaxAmount,
    accumulatedExpenseAmount: commissionSection.accumulatedExpenseAmount,
  })

  const yieldIncomeSection = useYieldIncomeSection({
    incomeState,
    accumulatedIncomeAmount: royaltySection.accumulatedIncomeAmount,
    accumulatedWithheldTaxAmount: royaltySection.accumulatedWithheldTaxAmount,
    accumulatedExpenseAmount: royaltySection.accumulatedExpenseAmount,
  })

  const rentalSection = useRentalSection({
    rentalKinds,
    incomeState,
    exemptedIncomeInstructionIndex: 4,
    incomeStateRetriever(incomeState) {
      return {
        incomeRef: incomeState.rentalIncomeRef,
      }
    },
    accumulatedIncomeAmount: yieldIncomeSection.accumulatedIncomeAmount,
    accumulatedWithheldTaxAmount: yieldIncomeSection.accumulatedWithheldTaxAmount,
    accumulatedExpenseAmount: yieldIncomeSection.accumulatedExpenseAmount,
  })

  const liberalProfessionSection = useRentalSection({
    rentalKinds: liberalProfessionKinds,
    incomeState,
    exemptedIncomeInstructionIndex: 5,
    incomeStateRetriever(incomeState) {
      return {
        incomeRef: incomeState.liberalProfessionIncomeRef,
      }
    },
    accumulatedIncomeAmount: rentalSection.accumulatedIncomeAmount,
    accumulatedWithheldTaxAmount: rentalSection.accumulatedWithheldTaxAmount,
    accumulatedExpenseAmount: rentalSection.accumulatedExpenseAmount,
  })
  
  const materialsAndLaborSection = useRoyaltySection({
    incomeSection: materialsAndLaborIncomeSection,
    incomeState,
    accumulatedIncomeAmount: liberalProfessionSection.accumulatedIncomeAmount,
    accumulatedWithheldTaxAmount: liberalProfessionSection.accumulatedWithheldTaxAmount,
    accumulatedExpenseAmount: liberalProfessionSection.accumulatedExpenseAmount,
  })
  
  const otherSection = useOtherSection({
    incomeState,
    accumulatedIncomeAmount: materialsAndLaborSection.accumulatedIncomeAmount,
    accumulatedWithheldTaxAmount: materialsAndLaborSection.accumulatedWithheldTaxAmount,
    accumulatedExpenseAmount: materialsAndLaborSection.accumulatedExpenseAmount,
  })

  const accumulatedWithheldTaxAmount = otherSection.accumulatedWithheldTaxAmount
  const [salaryIncome, ] = salarySection.incomeAmount
  const totalIncome = otherSection.accumulatedIncomeAmount

  const taxDeductionForLifeInsuranceAmountRef = useRef(new Decimal(0))
  const taxDeductionForHealthInsuranceAmountRef = useRef(new Decimal(0))

  const familialTaxDeduction = useFamilialTaxDeduction()
  const retirementTaxDeduction = useRetirementTaxDeduction({
    salaryIncome,
    totalIncome,
    taxDeductionForLifeInsuranceAmount: taxDeductionForLifeInsuranceAmountRef.current,
    taxDeductionForHealthInsuranceAmount: taxDeductionForHealthInsuranceAmountRef.current,
  })
  const insuranceTaxDeduction = useInsuranceTaxDeduction({
    taxDeductionForAnnuityInsuranceAmountThatCountForInsurance: retirementTaxDeduction.taxDeductionForAnnuityInsuranceAmountThatCountForInsurance,
  })
  const [taxDeductionForLifeInsuranceAmount, ] = insuranceTaxDeduction.taxDeductionForLifeInsuranceAmount
  const [taxDeductionForHealthInsuranceAmount, ] = insuranceTaxDeduction.taxDeductionForHealthInsuranceAmount
  taxDeductionForLifeInsuranceAmountRef.current = taxDeductionForLifeInsuranceAmount
  taxDeductionForHealthInsuranceAmountRef.current = taxDeductionForHealthInsuranceAmount
  const otherTaxDeduction = useOtherTaxDeduction()

  const accumulatedTaxDeductionAmountBeforeDonation = familialTaxDeduction.totalTaxDeduction
    .plus(retirementTaxDeduction.totalTaxDeduction)
    .plus(insuranceTaxDeduction.totalTaxDeduction)
    .plus(otherTaxDeduction.totalTaxDeduction)
  const accumulatedExpenseAmount = otherSection.accumulatedExpenseAmount

  const donation = useDonation({
    totalIncome,
    totalExpense: accumulatedExpenseAmount,
    totalTaxDeductionAmount: accumulatedTaxDeductionAmountBeforeDonation,
  })

  const accumulatedTaxDeductionAmount = accumulatedTaxDeductionAmountBeforeDonation.plus(donation.totalTaxDeduction)

  const taxCalculation = useTaxCalculation({
    totalIncome,
    totalWithheldTaxAmount: accumulatedWithheldTaxAmount,
    totalExpense: accumulatedExpenseAmount,
    totalTaxDeductionAmount: accumulatedTaxDeductionAmount,
  })

  return (
    <>
      <Modal
        open={modalState.open}
        onClose={() => setModalState({ open: false, content: null })}
      >
        {modalState.content}
      </Modal>
      <Form layout="vertical">
        <Flex gap="middle" wrap="wrap" justify="center" >
          <Col sm={span} md={topSummarySpan}>
            <Form.Item label="ขั้นบันไดภาษีสูงสุด">
              <PercentageDisplay amount={taxCalculation.taxAllocationByBrackets[taxCalculation.highestTaxBracketIndex].taxRate.mul(100)} />
            </Form.Item>
          </Col>
          <Col sm={span} md={topSummarySpan}>
            <Form.Item label="ภาษีที่ต้องชำระ">
              <MoneyDisplay amount={taxCalculation.totalTaxAmount} />
            </Form.Item>
          </Col>
          <Col sm={span} md={topSummarySpan}>
            <Form.Item label="ภาษีที่ชำระไว้แล้ว">
              <MoneyDisplay amount={accumulatedWithheldTaxAmount} />
            </Form.Item>
          </Col>
          <Col sm={span} md={topSummarySpan}>
            <Form.Item label={taxCalculation.totalTaxToBePaidAmount.gte(0) ? 'ภาษีที่ต้องชำระเพิ่ม' : 'ภาษีที่จะได้คืน'}>
              <MoneyDisplay amount={taxCalculation.totalTaxToBePaidAmount.abs()} />
            </Form.Item>
          </Col>
          <Col sm={span} md={topSummarySpan}>
            <Form.Item label="สัดส่วนภาษีต่อรายได้ทั้งหมด">
              <PercentageDisplay amount={taxCalculation.totalTaxAmountToTotalIncome.mul(100)} />
            </Form.Item>
          </Col>
        </Flex>
        <Row gutter={gutter}>
          <Col sm={span} lg={mainSpan}>
            <Card title={<p className="h1">เงินได้และค่าใช้จ่าย</p>}>
              <Flex gap="middle" vertical>
                <SalarySection {...salarySection} openExplanation={openModal} />
                <CommissionSection {...commissionSection} openExplanation={openModal} />
                <RoyaltySection {...royaltySection} sectionName="40(3)" kindName="ค่าลิขสิทธิ์ ค่าตอบแทนทรัพย์สินทางปัญญา" openExplanation={openModal} />
                <YieldIncomeSection {...yieldIncomeSection} openExplanation={openModal} />
                <RentalSection {...rentalSection} name="40(5)" openExplanation={openModal} />
                <RentalSection {...liberalProfessionSection} name="40(6)" openExplanation={openModal} />
                <RoyaltySection {...materialsAndLaborSection} sectionName="40(7)" kindName="ค่ารับเหมาทั้งค่าแรงและค่าของ" openExplanation={openModal} />
                <OtherSection {...otherSection} openExplanation={openModal} />
              </Flex>
            </Card>
          </Col>
          <Col sm={span} lg={mainSpan}>
            <Card title={<p className="h1">ค่าลดหย่อน</p>}>
              <FamilialTaxDeduction {...familialTaxDeduction} openExplanation={openModal} />
              <Divider orientation="left" />
              <RetirementTaxDeduction {...retirementTaxDeduction} openExplanation={openModal} />
              <Divider orientation="left" />
              <InsuranceTaxDeduction {...insuranceTaxDeduction} openExplanation={openModal} />
              <Divider orientation="left" />
              <OtherTaxDeduction {...otherTaxDeduction} openExplanation={openModal} />
              <Divider orientation="left" />
              <Form.Item label="ค่าลดหย่อนสะสม">
                <MoneyDisplay amount={accumulatedTaxDeductionAmountBeforeDonation} />
              </Form.Item>
              <Divider orientation="left" />
              <Donation {...donation} openExplanation={openModal} />
              <Divider orientation="left" />
              <Form.Item label="ค่าลดหย่อนสะสม">
                <MoneyDisplay amount={accumulatedTaxDeductionAmount} />
              </Form.Item>
            </Card>
          </Col>
          <Col sm={span} lg={mainSpan}>
            <Card title={<p className="h1">สรุปภาษี</p>}>
              <TaxCalculation
                {...taxCalculation}
                totalIncome={totalIncome}
                totalWithheldTaxAmount={accumulatedWithheldTaxAmount}
                totalExpense={accumulatedExpenseAmount}
                totalTaxDeductionAmount={accumulatedTaxDeductionAmount}
              />
            </Card>
          </Col>
        </Row>
      </Form>
    </>
  )
}

export default App
