import type {
    ReactNode,
} from 'react'
import {
    Fragment,
} from 'react'
import { MoneyInput, PercentageInput, PercentageDisplay, MoneyDisplay, ExplainableMoneyDisplay, Slider } from 'shared/Components'
import Decimal from 'decimal.js'
import { Form, Divider, Row, Col, Card, Radio, Checkbox, Flex, Button, InputNumber, Table, type TableProps } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import type { CheckboxGroupProps } from 'antd/es/checkbox';
import { convertADToBE } from 'shared/Utils';
import { precision } from 'shared/Constants'
import type {
    SalaryState,
    RoyaltyState,
    YieldIncomeState,
    RentalState,
    OtherState,
    FamilialTaxDeductionState,
    RetirementTaxDeductionState,
    InsuranceTaxDeductionState,
    OtherTaxDeductionState,
    DonationState,
    TaxCalculationState,
    TaxBracketDisplay,
} from 'domains/Tax/Hooks'
import {
    currentYear,
} from 'domains/Tax/Hooks'

interface OpenExplanation{
  openExplanation: (explanation: ReactNode[]) => void
}

const gutter = 16
const span = 24

interface SalaryProps extends SalaryState, OpenExplanation{
}

export function SalarySection({
  incomeAmount: [incomeAmount, setIncomeAmount],
  withheldTaxAmount: [withheldTaxAmount, setWithheldTaxAmount],
  expenseAmount,
  expenseAmountExplanation,
  accumulatedIncomeAmount,
  accumulatedWithheldTaxAmount,
  accumulatedExpenseAmount,
  openExplanation,
}: SalaryProps) {
  return (
    <Card title={<p className="h2">40(1)</p>} type="inner">
      <p className="h3">เงินเดือนหรือค่าตอบแทนจากการทำงานประจำ</p>
      <Row gutter={gutter}>
        <Col span={span}>
          <Form.Item label="จำนวนเงินก่อนหักภาษี">
            <MoneyInput amount={incomeAmount} onChange={setIncomeAmount} />
          </Form.Item>
          <Form.Item label="ภาษีถูกหัก">
            <MoneyInput amount={withheldTaxAmount} max={incomeAmount} onChange={setWithheldTaxAmount} />
          </Form.Item>
          <Form.Item label="ค่าใช้จ่ายที่หักได้คิดเป็น">
            <ExplainableMoneyDisplay amount={expenseAmount} onClick={() => openExplanation(expenseAmountExplanation)} />
          </Form.Item>
        </Col>
      </Row>
      <Divider orientation="left" />
      <Row gutter={gutter}>
        <Col span={span}>
          <Form.Item label="รายได้สุทธิสะสม">
            <MoneyDisplay amount={accumulatedIncomeAmount} />
          </Form.Item>
          <Form.Item label="ภาษีถูกหักสะสม">
            <MoneyDisplay amount={accumulatedWithheldTaxAmount} />
          </Form.Item>
          <Form.Item label="ค่าใช้จ่ายที่หักได้สะสม">
            <MoneyDisplay amount={accumulatedExpenseAmount} />
          </Form.Item>
        </Col>
      </Row>
    </Card>
  )
}

export function CommissionSection({
  incomeAmount: [incomeAmount, setIncomeAmount],
  withheldTaxAmount: [withheldTaxAmount, setWithheldTaxAmount],
  expenseAmount,
  expenseAmountExplanation,
  accumulatedIncomeAmount,
  accumulatedWithheldTaxAmount,
  accumulatedExpenseAmount,
  openExplanation,
}: SalaryProps) {
  return (
    <Card title={<p className="h2">40(2)</p>} type="inner">
      <p className="h3">ค่าคอมมิชชั่น</p>
      <Row gutter={gutter}>
        <Col span={span}>
          <Form.Item label="จำนวนเงินก่อนหักภาษี">
            <MoneyInput amount={incomeAmount} onChange={setIncomeAmount} />
          </Form.Item>
          <Form.Item label="ภาษีถูกหัก">
            <MoneyInput amount={withheldTaxAmount} max={incomeAmount} onChange={setWithheldTaxAmount} />
          </Form.Item>
          <Form.Item label="ค่าใช้จ่ายที่หักได้คิดเป็น">
            <ExplainableMoneyDisplay amount={expenseAmount} onClick={() => openExplanation(expenseAmountExplanation)} />
          </Form.Item>
        </Col>
      </Row>
      <Divider orientation="left" />
      <Row gutter={gutter}>
        <Col span={span}>
          <Form.Item label="รายได้สุทธิสะสม">
            <MoneyDisplay amount={accumulatedIncomeAmount} />
          </Form.Item>
          <Form.Item label="ภาษีถูกหักสะสม">
            <MoneyDisplay amount={accumulatedWithheldTaxAmount} />
          </Form.Item>
          <Form.Item label="ค่าใช้จ่ายที่หักได้สะสม">
            <MoneyDisplay amount={accumulatedExpenseAmount} />
          </Form.Item>
        </Col>
      </Row>
    </Card>
  )
}

interface RoyaltyProps extends RoyaltyState, OpenExplanation{
  sectionName: string
  kindName: string
}

const lumpSumOrRealExpenseRadioOptions: CheckboxGroupProps<boolean>['options'] = [
  { label: 'ปกติ', value: false },
  { label: 'หักตามจริง', value: true },
]

const maxInputTaxRate = new Decimal('99.99')

export function RoyaltySection({
  sectionName,
  kindName,
  incomeAmount: [incomeAmount, setIncomeAmount],
  withheldTaxAmount: [withheldTaxAmount, setWithheldTaxAmount],
  useRealExpense: [useRealExpense, setUseRealExpense],
  realExpenseAmount: [realExpenseAmount, setRealExpenseAmount],
  expenseAmount,
  expenseAmountExplanation,
  accumulatedIncomeAmount,
  accumulatedWithheldTaxAmount,
  accumulatedExpenseAmount,
  openExplanation,
}: RoyaltyProps) {
  return (
    <Card title={<p className="h2">{sectionName}</p>} type="inner">
      <p className="h3">{kindName}</p>
      <Row gutter={gutter}>
        <Col span={span}>
          <Form.Item label="จำนวนเงินก่อนหักภาษี">
            <MoneyInput amount={incomeAmount} onChange={setIncomeAmount} />
          </Form.Item>
          <Form.Item label="ภาษีถูกหัก">
            <MoneyInput amount={withheldTaxAmount} max={incomeAmount} onChange={setWithheldTaxAmount} />
          </Form.Item>
          <Card title="ค่าใช้จ่าย" size="small">
            <Form.Item label="การคิดค่าใช้จ่าย">
              <Radio.Group options={lumpSumOrRealExpenseRadioOptions} value={useRealExpense} onChange={({ target: { value } })=>{setUseRealExpense(value)}} />
            </Form.Item>
            {
              useRealExpense && (
                <Form.Item label="ค่าใช้จ่ายตามจริง">
                  <MoneyInput amount={realExpenseAmount} max={incomeAmount} onChange={setRealExpenseAmount} />
                </Form.Item>
              )
            }
            <Form.Item label="ค่าใช้จ่ายที่หักได้คิดเป็น">
              <ExplainableMoneyDisplay amount={expenseAmount} onClick={() => openExplanation(expenseAmountExplanation)} />
            </Form.Item>
          </Card>
        </Col>
      </Row>
      <Divider orientation="left" />
      <Row gutter={gutter}>
        <Col span={span}>
          <Form.Item label="รายได้สุทธิสะสม">
            <MoneyDisplay amount={accumulatedIncomeAmount} />
          </Form.Item>
          <Form.Item label="ภาษีถูกหักสะสม">
            <MoneyDisplay amount={accumulatedWithheldTaxAmount} />
          </Form.Item>
          <Form.Item label="ค่าใช้จ่ายที่หักได้สะสม">
            <MoneyDisplay amount={accumulatedExpenseAmount} />
          </Form.Item>
        </Col>
      </Row>
    </Card>
  )
}

interface YieldIncomeProps extends YieldIncomeState, OpenExplanation{
}

export function YieldIncomeSection({
  interestIncomeAmount: [interestIncomeAmount, setInterestIncomeAmount],
  interestWithheldTaxAmount: [interestWithheldTaxAmount, setInterestWithheldTaxAmount],
  dividendYields: { elements: dividendYields, add: addDividendYield, delete: deleteDividendYield, },
  accumulatedIncomeAmount,
  accumulatedWithheldTaxAmount,
  accumulatedExpenseAmount,
  openExplanation,
}: YieldIncomeProps) {
  return (
    <Card title={<p className="h2">40(4)</p>} type="inner">
      <p className="h3">ดอกเบี้ย</p>
      <Row gutter={gutter}>
        <Col span={span}>
          <Form.Item label="จำนวนเงินก่อนหักภาษี">
            <MoneyInput amount={interestIncomeAmount} onChange={setInterestIncomeAmount} />
          </Form.Item>
          <Form.Item label="ภาษีถูกหัก">
            <MoneyInput amount={interestWithheldTaxAmount} max={interestIncomeAmount} onChange={setInterestWithheldTaxAmount} />
          </Form.Item>
        </Col>
      </Row>
      <Divider orientation="left" />
      <p className="h3">เงินปันผล</p>
      <Row gutter={gutter}>
        <Col span={span}>
          <Flex gap="middle" vertical>
            {dividendYields.map(
              ({
                id,
                incomeAmount: [incomeAmount, setIncomeAmount],
                withheldTaxAmount: [withheldTaxAmount, setWithheldTaxAmount],
                payerIncomeTaxRate: [payerIncomeTaxRate, setPayerIncomeTaxRate],
                netIncome,
                taxCreditExplanation
              }, i) => (
                <Card key={id} title={`เงินปันผล #${i + 1}`} size="small" extra={<CloseOutlined onClick={() => deleteDividendYield(i)} />}>
                  <Form.Item label="จำนวนเงินก่อนหักภาษี">
                    <MoneyInput amount={incomeAmount} onChange={setIncomeAmount} />
                  </Form.Item>
                  <Form.Item label="ภาษีถูกหัก">
                    <MoneyInput amount={withheldTaxAmount} max={incomeAmount} onChange={setWithheldTaxAmount} />
                  </Form.Item>
                  <Form.Item label="อัตราภาษีนิติบุคคล">
                    <PercentageInput amount={payerIncomeTaxRate} max={maxInputTaxRate} onChange={setPayerIncomeTaxRate} />
                  </Form.Item>
                  <Form.Item label="เครดิตเป็นเงินได้สุทธิ">
                    <ExplainableMoneyDisplay amount={netIncome} onClick={() => openExplanation(taxCreditExplanation)} />
                  </Form.Item>
                </Card>
              )
            )}
            <Button onClick={addDividendYield}>เพิ่มรายการ</Button>
          </Flex>
        </Col>
      </Row>
      <Divider orientation="left" />
      <Row gutter={gutter}>
        <Col span={span}>
          <Form.Item label="รายได้สุทธิสะสม">
            <MoneyDisplay amount={accumulatedIncomeAmount} />
          </Form.Item>
          <Form.Item label="ภาษีถูกหักสะสม">
            <MoneyDisplay amount={accumulatedWithheldTaxAmount} />
          </Form.Item>
          <Form.Item label="ค่าใช้จ่ายที่หักได้สะสม">
            <MoneyDisplay amount={accumulatedExpenseAmount} />
          </Form.Item>
        </Col>
      </Row>
    </Card>
  )
}

interface RentalProps extends RentalState, OpenExplanation{
  name: string
}

export function RentalSection({
  name,
  kinds,
  accumulatedIncomeAmount,
  accumulatedWithheldTaxAmount,
  accumulatedExpenseAmount,
  openExplanation,
}: RentalProps) {
  return (
    <Card title={<p className="h2">{name}</p>} type="inner">
      {kinds.map(
        ({
          id,
          name,
          incomeAmount: [incomeAmount, setIncomeAmount],
          withheldTaxAmount: [withheldTaxAmount, setWithheldTaxAmount],
          useRealExpense: [useRealExpense, setUseRealExpense],
          realExpenseAmount: [realExpenseAmount, setRealExpenseAmount],
          expenseAmount,
          expenseExplanation,
        }) => (
          <Fragment key={id}>
            <p className="h3">{name}</p>
            <Row gutter={gutter}>
              <Col span={span}>
                <Form.Item label="จำนวนเงินก่อนหักภาษี">
                  <MoneyInput amount={incomeAmount} onChange={setIncomeAmount} />
                </Form.Item>
                <Form.Item label="ภาษีถูกหัก">
                  <MoneyInput amount={withheldTaxAmount} max={incomeAmount} onChange={setWithheldTaxAmount} />
                </Form.Item>
                <Card title="ค่าใช้จ่าย" size="small">
                  <Form.Item label="การคิดค่าใช้จ่าย">
                    <Radio.Group options={lumpSumOrRealExpenseRadioOptions} value={useRealExpense} onChange={({ target: { value } })=>{setUseRealExpense(value)}} />
                  </Form.Item>
                  {
                    useRealExpense && (
                      <Form.Item label="ค่าใช้จ่ายตามจริง">
                        <MoneyInput amount={realExpenseAmount} max={incomeAmount} onChange={setRealExpenseAmount} />
                      </Form.Item>
                    )
                  }
                  <Form.Item label="ค่าใช้จ่ายที่หักได้คิดเป็น">
                    <ExplainableMoneyDisplay amount={expenseAmount} onClick={() => openExplanation(expenseExplanation)} />
                  </Form.Item>
                </Card>
              </Col>
            </Row>
            <Divider orientation="left" />
          </Fragment>
        )
      )}
      <Row gutter={gutter}>
        <Col span={span}>
          <Form.Item label="รายได้สุทธิสะสม">
            <MoneyDisplay amount={accumulatedIncomeAmount} />
          </Form.Item>
          <Form.Item label="ภาษีถูกหักสะสม">
            <MoneyDisplay amount={accumulatedWithheldTaxAmount} />
          </Form.Item>
          <Form.Item label="ค่าใช้จ่ายที่หักได้สะสม">
            <MoneyDisplay amount={accumulatedExpenseAmount} />
          </Form.Item>
        </Col>
      </Row>
    </Card>
  )
}

interface OtherProps extends OtherState, OpenExplanation{
}

export function OtherSection({
  incomeAmount: [incomeAmount, setIncomeAmount],
  withheldTaxAmount: [withheldTaxAmount, setWithheldTaxAmount],
  expenseAmount: [expenseAmount, setExpenseAmount],
  accumulatedIncomeAmount,
  accumulatedWithheldTaxAmount,
  accumulatedExpenseAmount,
  openExplanation,
}: OtherProps) {
  return (
    <Card title={<p className="h2">40(8)</p>} type="inner">
      <p className="h3">เงินได้อื่นๆ</p>
      <Row gutter={gutter}>
        <Col span={span}>
          <Form.Item label="จำนวนเงินก่อนหักภาษี">
            <MoneyInput amount={incomeAmount} onChange={setIncomeAmount} />
          </Form.Item>
          <Form.Item label="ภาษีถูกหัก">
            <MoneyInput amount={withheldTaxAmount} max={incomeAmount} onChange={setWithheldTaxAmount} />
          </Form.Item>
          <Form.Item label="ค่าใช้จ่ายที่หักได้คิดเป็น">
            <MoneyInput amount={expenseAmount} max={incomeAmount} onChange={setExpenseAmount} />
          </Form.Item>
        </Col>
      </Row>
      <Divider orientation="left" />
      <Row gutter={gutter}>
        <Col span={span}>
          <Form.Item label="รายได้สุทธิสะสม">
            <MoneyDisplay amount={accumulatedIncomeAmount} />
          </Form.Item>
          <Form.Item label="ภาษีถูกหักสะสม">
            <MoneyDisplay amount={accumulatedWithheldTaxAmount} />
          </Form.Item>
          <Form.Item label="ค่าใช้จ่ายที่หักได้สะสม">
            <MoneyDisplay amount={accumulatedExpenseAmount} />
          </Form.Item>
        </Col>
      </Row>
    </Card>
  )
}

interface FamilialTaxDeductionProps extends FamilialTaxDeductionState, OpenExplanation{
}

export function FamilialTaxDeduction({
  personalTaxDeductionAmount,
  children: [children, updateChildrenInputs],
  numOfChildrenBornBefore2018,
  taxDeductionForChildrenBornBefore2018,
  taxDeductionForChildrenBornBefore2018Explanation,
  isFirstChildBornInOrAfter2018,
  taxDeductionForFirstChildBornInOrAfter2018,
  numOfChildrenAfterTheFirstBornInOrAfter2018,
  taxDeductionForChildrenAfterTheFirstBornInOrAfter2018,
  taxDeductionForChildrenAfterTheFirstBornInOrAfter2018Explanation,
  numOfAdoptedChildren,
  taxDeductionForAdoptedChildren,
  taxDeductionForAdoptedChildrenExplanation,
  numOfParentsOver60: [numOfParentsOver60, setNumOfParentsOver60],
  taxDeductionForParents,
  taxDeductionForParentsExplanation,
  totalTaxDeduction,
  openExplanation,
}: FamilialTaxDeductionProps) {
  return (
    <>
      <Col span={span}>
        <Form.Item label="ค่าลดหย่อนส่วนบุคคล">
          <MoneyDisplay amount={personalTaxDeductionAmount} />
        </Form.Item>
        <Divider orientation="left" />
        <p className="h3">ข้อมูลบุตร</p>
        <Flex gap="middle" vertical className="child-info-box">
          {children.map(
            (x, i) => (
              <Card key={x.id} title={`บุตร #${i + 1}`} size="small" extra={<CloseOutlined onClick={()=> updateChildrenInputs(y => { y.splice(i, 1)})} />}>
                <Flex gap="middle" vertical>
                  <Form.Item label="ปีที่เกิด" className="child-birth-year">
                    <InputNumber
                        min={543}
                        precision={0}
                        value={x.birthYearBE}
                        onChange={value => updateChildrenInputs(y => {y[i].birthYearBE = value ?? 0})}
                    />
                  </Form.Item>
                  <Checkbox checked={x.isAdopted} onChange={e => updateChildrenInputs(y => {y[i].isAdopted = e.target.checked})}>
                    เป็นบุตรบุญธรรม
                  </Checkbox>
                  <Checkbox checked={x.isStudying} onChange={e => updateChildrenInputs(y => {y[i].isStudying = e.target.checked})}>
                    เรียนอยู่ระดับอนุปริญญา (ปวส. หรือ ปวท.) หรือปริญญาตรีขึ้นไป
                  </Checkbox>
                  <Checkbox checked={x.isDeclareDisabled} onChange={e => updateChildrenInputs(y => {y[i].isDeclareDisabled = e.target.checked})}>
                    ถูกศาลสั่งให้เป็นคนไร้ความสามารถ
                  </Checkbox>
                  <Checkbox checked={x.isIncomeWithinLimit} onChange={e => updateChildrenInputs(y => {y[i].isIncomeWithinLimit = e.target.checked})}>
                    ไม่มีเงินได้หรือมีเงินได้ต่ำกว่า 30000 บาท ในปี
                  </Checkbox>
                </Flex>
              </Card>
            )
          )}
          <Button onClick={() => updateChildrenInputs(x => { x.push({ id: crypto.randomUUID(), birthYearBE: convertADToBE(currentYear), isAdopted: false, isStudying: false, isDeclareDisabled: false, isIncomeWithinLimit: true }) })}>เพิ่มบุตร</Button>
        </Flex>
        <Form.Item label="ค่าลดหย่อนจากบุตรที่เกิดก่อนปี 2561 ที่เข้าเงื่อนไข">
          <ExplainableMoneyDisplay amount={taxDeductionForChildrenBornBefore2018} onClick={() => openExplanation(taxDeductionForChildrenBornBefore2018Explanation)} />
        </Form.Item>
        <Form.Item label="ค่าลดหย่อนจากบุตรคนแรกที่เกิดตั้งแต่ปี 2561 เป็นต้นไป ที่เข้าเงื่อนไข">
          <MoneyDisplay amount={taxDeductionForFirstChildBornInOrAfter2018} />
        </Form.Item>
        <Form.Item label="ค่าลดหย่อนจากบุตรคนที่สองขึ้นไปที่เกิดตั้งแต่ปี 2561 เป็นต้นไป ที่เข้าเงื่อนไข">
          <ExplainableMoneyDisplay amount={taxDeductionForChildrenAfterTheFirstBornInOrAfter2018} onClick={() => openExplanation(taxDeductionForChildrenAfterTheFirstBornInOrAfter2018Explanation)} />
        </Form.Item>
        <Form.Item label="ค่าลดหย่อนจากบุตรบุญธรรม ที่เข้าเงื่อนไข">
          <ExplainableMoneyDisplay amount={taxDeductionForAdoptedChildren} onClick={() => openExplanation(taxDeductionForAdoptedChildrenExplanation)} />
        </Form.Item>
        <Divider orientation="left" />
        <Form.Item label="จำนวนบิดามารดาที่อายุมากกว่า 60 ปี ขึ้นไป และมีเงินได้ไม่ถึง 30000 บาท ในปี">
          <Flex gap="middle">
            <Col span={12}>
              <Slider step={1} min={0} max={2} value={numOfParentsOver60} onChange={e => setNumOfParentsOver60(e)} />
            </Col>
            <Col span={12}>
              <InputNumber
                  min={0}
                  max={2}
                  precision={0}
                  value={numOfParentsOver60}
                  addonAfter="คน"
                  onChange={value => setNumOfParentsOver60(value ?? 0)}
              />
            </Col>
          </Flex>
        </Form.Item>
        <Form.Item label="ค่าลดหย่อนจากบิดามารดาคิดได้เป็น">
          <ExplainableMoneyDisplay amount={taxDeductionForParents} onClick={() => openExplanation(taxDeductionForParentsExplanation)} />
        </Form.Item>
      </Col>
    </>
  )
}

interface RetirementTaxDeductionProps extends RetirementTaxDeductionState, OpenExplanation{
}

export function RetirementTaxDeduction({
  taxDeductionForProvidentFundAmountCap,
  taxDeductionForProvidentFundAmountCapExplanation,
  taxDeductionForProvidentFundAmount: [taxDeductionForProvidentFundAmount, setTaxDeductionForProvidentFundAmount],
  taxDeductionForPrivateSchoolTeacherWelfareFundAmountCap,
  taxDeductionForPrivateSchoolTeacherWelfareFundAmountCapExplanation,
  taxDeductionForPrivateSchoolTeacherWelfareFundAmount: [taxDeductionForPrivateSchoolTeacherWelfareFundAmount, setTaxDeductionForPrivateSchoolTeacherWelfareFundAmount],
  taxDeductionForGovernmentPensionFundAmountCap,
  taxDeductionForGovernmentPensionFundAmountCapExplanation,
  taxDeductionForGovernmentPensionFundAmount: [taxDeductionForGovernmentPensionFundAmount, setTaxDeductionForGovernmentPensionFundAmount],
  taxDeductionForRetirementMutualFundAmountCap,
  taxDeductionForRetirementMutualFundAmountCapExplanation,
  taxDeductionForRetirementMutualFundAmount: [taxDeductionForRetirementMutualFundAmount, setTaxDeductionForRetirementMutualFundAmount],
  taxDeductionForNationalSavingsFundAmountCap,
  taxDeductionForNationalSavingsFundAmountCapExplanation,
  taxDeductionForNationalSavingsFundAmount: [taxDeductionForNationalSavingsFundAmount, setTaxDeductionForNationalSavingsFundAmount],
  taxDeductionForAnnuityInsuranceAmountCap,
  taxDeductionForAnnuityInsuranceAmountCapExplanation,
  taxDeductionForAnnuityInsuranceAmount: [taxDeductionForAnnuityInsuranceAmount, setTaxDeductionForAnnuityInsuranceAmount],
  totalTaxDeduction,
  openExplanation,
}: RetirementTaxDeductionProps) {
  return (
    <>
      <Col span={span}>
        <Form.Item label={<span>กองทุนสำรองเลี้ยงชีพ (จำนวนเงินสูงสุดที่สามารถจ่ายได้ <span className="link" onClick={() => openExplanation(taxDeductionForProvidentFundAmountCapExplanation)}>{taxDeductionForProvidentFundAmountCap.toFixed(precision)}</span> บาท)</span>}>
          <Flex gap="middle">
            {/* <Col span={12}>
              <Slider step={0.01} min={0} max={taxDeductionForProvidentFundAmountCap.toNumber()} value={taxDeductionForProvidentFundAmount.toNumber()} onChange={e => setTaxDeductionForProvidentFundAmount(new Decimal(e).toDecimalPlaces(precision))} />
            </Col> */}
            <Col span={12}>
              <MoneyInput amount={taxDeductionForProvidentFundAmount} max={taxDeductionForProvidentFundAmountCap} onChange={setTaxDeductionForProvidentFundAmount} />
            </Col>
          </Flex>
        </Form.Item>
        <Form.Item label={<span>กองทุนสงเคราะห์ครูโรงเรียนเอกชน (จำนวนเงินสูงสุดที่สามารถจ่ายได้ <span className="link" onClick={() => openExplanation(taxDeductionForPrivateSchoolTeacherWelfareFundAmountCapExplanation)}>{taxDeductionForPrivateSchoolTeacherWelfareFundAmountCap.toFixed(precision)}</span> บาท)</span>}>
          <Flex gap="middle">
            {/* <Col span={12}>
              <Slider step={0.01} min={0} max={taxDeductionForPrivateSchoolTeacherWelfareFundAmountCap.toNumber()} value={taxDeductionForPrivateSchoolTeacherWelfareFundAmount.toNumber()} onChange={e => setTaxDeductionForPrivateSchoolTeacherWelfareFundAmount(new Decimal(e).toDecimalPlaces(precision))} />
            </Col> */}
            <Col span={12}>
              <MoneyInput amount={taxDeductionForPrivateSchoolTeacherWelfareFundAmount} max={taxDeductionForPrivateSchoolTeacherWelfareFundAmountCap} onChange={setTaxDeductionForPrivateSchoolTeacherWelfareFundAmount} />
            </Col>
          </Flex>
        </Form.Item>
        <Form.Item label={<span>กบข. (จำนวนเงินสูงสุดที่สามารถจ่ายได้ <span className="link" onClick={() => openExplanation(taxDeductionForGovernmentPensionFundAmountCapExplanation)}>{taxDeductionForGovernmentPensionFundAmountCap.toFixed(precision)}</span> บาท)</span>}>
          <Flex gap="middle">
            {/* <Col span={12}>
              <Slider step={0.01} min={0} max={taxDeductionForGovernmentPensionFundAmountCap.toNumber()} value={taxDeductionForGovernmentPensionFundAmount.toNumber()} onChange={e => setTaxDeductionForGovernmentPensionFundAmount(new Decimal(e).toDecimalPlaces(precision))} />
            </Col> */}
            <Col span={12}>
              <MoneyInput amount={taxDeductionForGovernmentPensionFundAmount} max={taxDeductionForGovernmentPensionFundAmountCap} onChange={setTaxDeductionForGovernmentPensionFundAmount} />
            </Col>
          </Flex>
        </Form.Item>
        <Form.Item label={<span>RMF (จำนวนเงินสูงสุดที่สามารถจ่ายได้ <span className="link" onClick={() => openExplanation(taxDeductionForRetirementMutualFundAmountCapExplanation)}>{taxDeductionForRetirementMutualFundAmountCap.toFixed(precision)}</span> บาท)</span>}>
          <Flex gap="middle">
            {/* <Col span={12}>
              <Slider step={0.01} min={0} max={taxDeductionForRetirementMutualFundAmountCap.toNumber()} value={taxDeductionForRetirementMutualFundAmount.toNumber()} onChange={e => setTaxDeductionForRetirementMutualFundAmount(new Decimal(e).toDecimalPlaces(precision))} />
            </Col> */}
            <Col span={12}>
              <MoneyInput amount={taxDeductionForRetirementMutualFundAmount} max={taxDeductionForRetirementMutualFundAmountCap} onChange={setTaxDeductionForRetirementMutualFundAmount} />
            </Col>
          </Flex>
        </Form.Item>
        <Form.Item label={<span>กอช. (จำนวนเงินสูงสุดที่สามารถจ่ายได้ <span className="link" onClick={() => openExplanation(taxDeductionForNationalSavingsFundAmountCapExplanation)}>{taxDeductionForNationalSavingsFundAmountCap.toFixed(precision)}</span> บาท)</span>}>
          <Flex gap="middle">
            {/* <Col span={12}>
              <Slider step={0.01} min={0} max={taxDeductionForNationalSavingsFundAmountCap.toNumber()} value={taxDeductionForNationalSavingsFundAmount.toNumber()} onChange={e => setTaxDeductionForNationalSavingsFundAmount(new Decimal(e).toDecimalPlaces(precision))} />
            </Col> */}
            <Col span={12}>
              <MoneyInput amount={taxDeductionForNationalSavingsFundAmount} max={taxDeductionForNationalSavingsFundAmountCap} onChange={setTaxDeductionForNationalSavingsFundAmount} />
            </Col>
          </Flex>
        </Form.Item>
        <Form.Item label={<span>ประกันชีวิตแบบบำนาญ (จำนวนเงินสูงสุดที่สามารถจ่ายได้ <span className="link" onClick={() => openExplanation(taxDeductionForAnnuityInsuranceAmountCapExplanation)}>{taxDeductionForAnnuityInsuranceAmountCap.toFixed(precision)}</span> บาท)</span>}>
          <Flex gap="middle">
            {/* <Col span={12}>
              <Slider step={0.01} min={0} max={taxDeductionForAnnuityInsuranceAmountCap.toNumber()} value={taxDeductionForAnnuityInsuranceAmount.toNumber()} onChange={e => setTaxDeductionForAnnuityInsuranceAmount(new Decimal(e).toDecimalPlaces(precision))} />
            </Col> */}
            <Col span={12}>
              <MoneyInput amount={taxDeductionForAnnuityInsuranceAmount} max={taxDeductionForAnnuityInsuranceAmountCap} onChange={setTaxDeductionForAnnuityInsuranceAmount} />
            </Col>
          </Flex>
        </Form.Item>
      </Col>
    </>
  )
}

interface InsuranceTaxDeductionProps extends InsuranceTaxDeductionState, OpenExplanation{
}

export function InsuranceTaxDeduction({
  taxDeductionForLifeInsuranceAmountCap,
  taxDeductionForLifeInsuranceAmountCapExplanation,
  taxDeductionForLifeInsuranceAmount: [taxDeductionForLifeInsuranceAmount, setTaxDeductionForLifeInsuranceAmount],
  taxDeductionForHealthInsuranceAmountCap,
  taxDeductionForHealthInsuranceAmountCapExplanation,
  taxDeductionForHealthInsuranceAmount: [taxDeductionForHealthInsuranceAmount, setTaxDeductionForHealthInsuranceAmount],
  taxDeductionForHealthInsuranceOfParentsAmountCap,
  taxDeductionForHealthInsuranceOfParentsAmountCapExplanation,
  taxDeductionForHealthInsuranceOfParentsAmount: [taxDeductionForHealthInsuranceOfParentsAmount, setTaxDeductionForHealthInsuranceOfParentsAmount],
  totalTaxDeduction,
  openExplanation,
}: InsuranceTaxDeductionProps) {
  return (
    <>
      <Col span={span}>
        <Form.Item label={<span>ประกันชีวิตทั่วไป (จำนวนเงินสูงสุดที่สามารถจ่ายได้ <span className="link" onClick={() => openExplanation(taxDeductionForLifeInsuranceAmountCapExplanation)}>{taxDeductionForLifeInsuranceAmountCap.toFixed(precision)}</span> บาท)</span>}>
          <Flex gap="middle">
            {/* <Col span={12}>
              <Slider step={0.01} min={0} max={taxDeductionForLifeInsuranceAmountCap.toNumber()} value={taxDeductionForLifeInsuranceAmount.toNumber()} onChange={e => setTaxDeductionForLifeInsuranceAmount(new Decimal(e).toDecimalPlaces(precision))} />
            </Col> */}
            <Col span={12}>
              <MoneyInput amount={taxDeductionForLifeInsuranceAmount} max={taxDeductionForLifeInsuranceAmountCap} onChange={setTaxDeductionForLifeInsuranceAmount} />
            </Col>
          </Flex>
        </Form.Item>
        <Form.Item label={<span>ประกันสุขภาพส่วนตัว (จำนวนเงินสูงสุดที่สามารถจ่ายได้ <span className="link" onClick={() => openExplanation(taxDeductionForHealthInsuranceAmountCapExplanation)}>{taxDeductionForHealthInsuranceAmountCap.toFixed(precision)}</span> บาท)</span>}>
          <Flex gap="middle">
            {/* <Col span={12}>
              <Slider step={0.01} min={0} max={taxDeductionForHealthInsuranceAmountCap.toNumber()} value={taxDeductionForHealthInsuranceAmount.toNumber()} onChange={e => setTaxDeductionForHealthInsuranceAmount(new Decimal(e).toDecimalPlaces(precision))} />
            </Col> */}
            <Col span={12}>
              <MoneyInput amount={taxDeductionForHealthInsuranceAmount} max={taxDeductionForHealthInsuranceAmountCap} onChange={setTaxDeductionForHealthInsuranceAmount} />
            </Col>
          </Flex>
        </Form.Item>
        <Form.Item label={<span>ประกันสุขภาพบิดามารดา (จำนวนเงินสูงสุดที่สามารถจ่ายได้ {taxDeductionForHealthInsuranceOfParentsAmountCap.toFixed(precision)} บาท)</span>}>
          <Flex gap="middle">
            {/* <Col span={12}>
              <Slider step={0.01} min={0} max={taxDeductionForHealthInsuranceOfParentsAmountCap.toNumber()} value={taxDeductionForHealthInsuranceOfParentsAmount.toNumber()} onChange={e => setTaxDeductionForHealthInsuranceOfParentsAmount(new Decimal(e).toDecimalPlaces(precision))} />
            </Col> */}
            <Col span={12}>
              <MoneyInput amount={taxDeductionForHealthInsuranceOfParentsAmount} max={taxDeductionForHealthInsuranceOfParentsAmountCap} onChange={setTaxDeductionForHealthInsuranceOfParentsAmount} />
            </Col>
          </Flex>
        </Form.Item>
      </Col>
    </>
  )
}

interface OtherTaxDeductionProps extends OtherTaxDeductionState, OpenExplanation{
}

export function OtherTaxDeduction({
  taxDeductionForSocialSecurityAmountCap,
  taxDeductionForSocialSecurityAmountCapExplanation,
  taxDeductionForSocialSecurityAmount: [taxDeductionForSocialSecurityAmount, setTaxDeductionForSocialSecurityAmount],
  numOfDisabledPeopleUnderCare: [numOfDisabledPeopleUnderCare, setNumOfDisabledPeopleUnderCare],
  taxDeductionForDisabledPeopleUnderCare,
  taxDeductionForDisabledPeopleUnderCareExplanation,
  taxDeductionForHousingLoanInterestAmountCap,
  taxDeductionForHousingLoanInterestCapExplanation,
  taxDeductionForHousingLoanInterestAmount: [taxDeductionForHousingLoanInterestAmount, setTaxDeductionForHousingLoanInterestAmount],
  totalTaxDeduction,
  openExplanation,
}: OtherTaxDeductionProps) {
  return (
    <>
      <Col span={span}>
        <Form.Item label={<span>ประกันสังคม (จำนวนเงินสูงสุดที่สามารถจ่ายได้ {taxDeductionForSocialSecurityAmountCap.toFixed(precision)} บาท)</span>}>
          <Flex gap="middle">
            {/* <Col span={12}>
              <Slider step={0.01} min={0} max={taxDeductionForSocialSecurityAmountCap.toNumber()} value={taxDeductionForSocialSecurityAmount.toNumber()} onChange={e => setTaxDeductionForSocialSecurityAmount(new Decimal(e).toDecimalPlaces(precision))} />
            </Col> */}
            <Col span={12}>
              <MoneyInput amount={taxDeductionForSocialSecurityAmount} max={taxDeductionForSocialSecurityAmountCap} onChange={setTaxDeductionForSocialSecurityAmount} />
            </Col>
          </Flex>
        </Form.Item>
        <Form.Item label="จำนวนผู้พิการหรือทุพพลภาพที่อยู่ใต้การดูแล">
          <InputNumber
              min={0}
              precision={0}
              value={numOfDisabledPeopleUnderCare}
              addonAfter="คน"
              onChange={value => setNumOfDisabledPeopleUnderCare(value ?? 0)}
          />
        </Form.Item>
        <Form.Item label="ค่าลดหย่อนจากผู้พิการหรือทุพพลภาพที่อยู่ใต้การดูแลคิดได้เป็น">
          <ExplainableMoneyDisplay amount={taxDeductionForDisabledPeopleUnderCare} onClick={() => openExplanation(taxDeductionForDisabledPeopleUnderCareExplanation)} />
        </Form.Item>
        <Form.Item label={<span>ดอกเบี้ยซื้อที่อยู่อาศัย (จำนวนเงินสูงสุดที่สามารถจ่ายได้ {taxDeductionForHousingLoanInterestAmountCap.toFixed(precision)} บาท)</span>}>
          <Flex gap="middle">
            {/* <Col span={12}>
              <Slider step={0.01} min={0} max={taxDeductionForHousingLoanInterestAmountCap.toNumber()} value={taxDeductionForHousingLoanInterestAmount.toNumber()} onChange={e => setTaxDeductionForHousingLoanInterestAmount(new Decimal(e).toDecimalPlaces(precision))} />
            </Col> */}
            <Col span={12}>
              <MoneyInput amount={taxDeductionForHousingLoanInterestAmount} max={taxDeductionForHousingLoanInterestAmountCap} onChange={setTaxDeductionForHousingLoanInterestAmount} />
            </Col>
          </Flex>
        </Form.Item>
      </Col>
    </>
  )
}

interface DonationProps extends DonationState, OpenExplanation{
}

export function Donation({
  educationalDonationAmountCap,
  educationalDonationAmountCapExplanation,
  educationalDonationAmount: [educationalDonationAmount, setEducationalDonationAmount],
  taxDeductionForEducationalDonationAmount,
  taxDeductionForEducationalDonationAmountExplanation,
  otherDonationAmountCap,
  otherDonationAmountCapExplanation,
  otherDonationAmount: [otherDonationAmount, setOtherDonationAmount],
  totalTaxDeduction,
  openExplanation,
}: DonationProps) {
  return (
    <>
      <Col span={span}>
        <Form.Item label={<span>เงินบริจาคเพื่อการศึกษา (จำนวนเงินสูงสุดที่สามารถจ่ายได้ <span className="link" onClick={() => openExplanation(educationalDonationAmountCapExplanation)}>{educationalDonationAmountCap.toFixed(precision)}</span> บาท)</span>}>
          <Flex gap="middle">
            {/* <Col span={12}>
              <Slider step={0.01} min={0} max={educationalDonationAmountCap.toNumber()} value={educationalDonationAmount.toNumber()} onChange={e => setEducationalDonationAmount(new Decimal(e).toDecimalPlaces(precision))} />
            </Col> */}
            <Col span={12}>
              <MoneyInput amount={educationalDonationAmount} max={educationalDonationAmountCap} onChange={setEducationalDonationAmount} />
            </Col>
          </Flex>
        </Form.Item>
        <Form.Item label="ค่าลดหย่อนจากเงินบริจาคเพื่อการศึกษาคิดได้เป็น">
          <ExplainableMoneyDisplay amount={taxDeductionForEducationalDonationAmount} onClick={() => openExplanation(taxDeductionForEducationalDonationAmountExplanation)} />
        </Form.Item>
        <Form.Item label={<span>เงินบริจาคทั่วไป (จำนวนเงินสูงสุดที่สามารถจ่ายได้ <span className="link" onClick={() => openExplanation(otherDonationAmountCapExplanation)}>{otherDonationAmountCap.toFixed(precision)}</span> บาท)</span>}>
          <Flex gap="middle">
            {/* <Col span={12}>
              <Slider step={0.01} min={0} max={otherDonationAmountCap.toNumber()} value={otherDonationAmount.toNumber()} onChange={e => setOtherDonationAmount(new Decimal(e).toDecimalPlaces(precision))} />
            </Col> */}
            <Col span={12}>
              <MoneyInput amount={otherDonationAmount} max={otherDonationAmountCap} onChange={setOtherDonationAmount} />
            </Col>
          </Flex>
        </Form.Item>
      </Col>
    </>
  )
}

interface TaxCalculationProps extends TaxCalculationState{
  totalIncome: Decimal
  totalWithheldTaxAmount: Decimal
  totalExpense: Decimal
  totalTaxDeductionAmount: Decimal
}

export function TaxCalculation({
  totalIncome,
  totalWithheldTaxAmount,
  totalExpense,
  totalTaxDeductionAmount,
  totalIncomeAmountAfterExpense,
  totalIncomeAmountAfterTaxDeduction,
  totalTaxAmount,
  totalTaxToBePaidAmount,
  taxAllocationByBrackets,
  highestTaxBracketIndex,
  totalTaxAmountToTotalIncome,
}: TaxCalculationProps) {
  const taxBracketColumns: TableProps<TaxBracketDisplay>['columns'] = [
    {
      title: 'เงินได้สุทธิ',
      dataIndex: 'range',
      key: 'range',
      render: (range: ReactNode) => range,
    },
    {
      title: 'อัตราภาษี',
      dataIndex: 'taxRate',
      key: 'taxRate',
      render: (taxRate: Decimal) => <>{taxRate.mul(100).toFixed(precision)}%</>,
    },
    {
      title: 'เงินได้ที่ตกในขั้น',
      dataIndex: 'incomeAllocated',
      key: 'incomeAllocated',
      render: (incomeAllocated: Decimal) => incomeAllocated.toFixed(precision),
    },
    {
      title: 'ภาษีที่ต้องจ่าย',
      dataIndex: 'taxAmountAllocated',
      key: 'taxAmountAllocated',
      render: (taxAmountAllocated: Decimal) => taxAmountAllocated.toFixed(precision),
    },
  ]
  return (
    <>
      <Col span={span}>
        <Form.Item label="เงินได้ที่ต้องเสียภาษี">
          <MoneyDisplay amount={totalIncome} />
        </Form.Item>
        <Form.Item label="ค่าใช้จ่าย">
          <MoneyDisplay amount={totalExpense} />
        </Form.Item>
        <Form.Item label="ค่าลดหย่อน">
          <MoneyDisplay amount={totalTaxDeductionAmount} />
        </Form.Item>
        <Form.Item label="เงินได้สุทธิ">
          <MoneyDisplay amount={totalIncomeAmountAfterTaxDeduction} />
        </Form.Item>
        <p className="h3">ภาษีขั้นบันได</p>
        <Flex vertical={true}>
          อ้างอิง:
          <a href="https://www.rd.go.th/5938.html" target="_blank">บัญชีอัตราภาษีเงินได้</a>
          <a href="https://rd.go.th/37669.html#:~:text=%E0%B8%A1%E0%B8%B2%E0%B8%95%E0%B8%A3%E0%B8%B2%204%20%E0%B9%83%E0%B8%AB%E0%B9%89%E0%B8%A2%E0%B8%81%E0%B9%80%E0%B8%A7%E0%B9%89%E0%B8%99%E0%B8%A0%E0%B8%B2%E0%B8%A9%E0%B8%B5%E0%B9%80%E0%B8%87%E0%B8%B4%E0%B8%99%E0%B9%84%E0%B8%94%E0%B9%89,%E0%B9%80%E0%B8%87%E0%B8%B4%E0%B8%99%E0%B9%84%E0%B8%94%E0%B9%89%E0%B8%AA%E0%B8%B8%E0%B8%97%E0%B8%98%E0%B8%B4%E0%B8%97%E0%B8%B5%E0%B9%88%E0%B9%80%E0%B8%81%E0%B8%B4%E0%B8%94" target="_blank">ยกเว้นภาษีเงินได้ส่วนที่ไม่เกินหนึ่งแสนห้าหมื่นบาทแรก</a>
        </Flex>
        <Table columns={taxBracketColumns} dataSource={taxAllocationByBrackets} pagination={{position: []}} scroll={{ x: 'max-content' }} className="tax-bracket" />
        <Form.Item label="ขั้นบันไดภาษีสูงสุด">
          <PercentageDisplay amount={taxAllocationByBrackets[highestTaxBracketIndex].taxRate.mul(100)} />
        </Form.Item>
        <Form.Item label="ภาษีที่ต้องชำระ">
          <MoneyDisplay amount={totalTaxAmount} />
        </Form.Item>
        <Form.Item label="ภาษีที่ชำระไว้แล้ว">
          <MoneyDisplay amount={totalWithheldTaxAmount} />
        </Form.Item>
        <Form.Item label={totalTaxToBePaidAmount.gte(0) ? 'ภาษีที่ต้องชำระเพิ่ม' : 'ภาษีที่จะได้คืน'}>
          <MoneyDisplay amount={totalTaxToBePaidAmount.abs()} />
        </Form.Item>
        <Form.Item label="สัดส่วนภาษีต่อรายได้ทั้งหมด">
          <PercentageDisplay amount={totalTaxAmountToTotalIncome.mul(100)} />
        </Form.Item>
      </Col>
    </>
  )
}
