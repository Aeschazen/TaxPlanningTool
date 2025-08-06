import type {
  ReactNode,
  Dispatch,
  SetStateAction,
  RefObject,
} from 'react'
import { useState, useRef } from 'react'
import { useImmer, type Updater } from 'use-immer';
import Decimal from 'decimal.js'
import { Divider } from 'antd';
import { from, reduce, count, some } from 'ix/iterable';
import { filter, orderBy } from 'ix/iterable/operators';
import { DateTime } from 'luxon';
import { useTrackedState, useTriggerableRef, clampLimit, convertBEToAD } from 'shared/Utils';
import { precision } from 'shared/Constants'
import type {
  SharedValue,
} from 'domains/Tax/Components/Explanations'
import {
  ExplainSharedValue,
  ExplainXPercentOfYForIncome,
  ExplainXPercentOfYForTaxDeduction,
  ExplainLimit,
  ExplainNetExpense,
  ExplainNetTaxDeductionCap,
  ExplainRealExpense,

  green,
  yellow,
} from 'domains/Tax/Components/Explanations'

export const currentYear = DateTime.now().year

const salaryCommissionExpenseLimit = new Decimal(100000)
const salaryCommissionExpenseRate = new Decimal('0.5')

const salaryCommissionSharedExpenseText = 'ค่าใช้จ่ายที่หักได้'
const salaryCommissionSharedExpenseRemainingText = 'แต่ไม่เกินค่าใช้จ่ายที่หักได้คงเหลือ'

export function useSalarySection({incomeState}: SalarySetup): SalaryState{
  const { salaryIncome, commissionExpenseRef } = incomeState
  const [incomeAmount, setIncomeAmount] = salaryIncome
  const trackedWithheldTaxAmount = useTrackedState<Decimal>(new Decimal(0))

  const withheldTaxAmountRef = useRef<Decimal>(new Decimal(0))
  if (trackedWithheldTaxAmount.isModified)
    withheldTaxAmountRef.current = trackedWithheldTaxAmount.value
  withheldTaxAmountRef.current = Decimal.min(withheldTaxAmountRef.current, incomeAmount)

  const netIncomeAmount = incomeAmount

  const expenseAmountExplanation: ReactNode[] = []

  const baseExpense = netIncomeAmount.mul(salaryCommissionExpenseRate).toDecimalPlaces(precision)
  const remainingExpenseLimit = Decimal.max(salaryCommissionExpenseLimit.minus(commissionExpenseRef.current), 0)
  expenseAmountExplanation.push(<ExplainSharedValue key="0" topic={salaryCommissionSharedExpenseText} totalAmount={salaryCommissionExpenseLimit} usedBy={[{topic: '40(2)', totalAmount: commissionExpenseRef.current}]} remainingAmount={remainingExpenseLimit} />)
  expenseAmountExplanation.push(<Divider key="1" orientation="left" />)
  expenseAmountExplanation.push(<ExplainXPercentOfYForIncome key="2" base={netIncomeAmount} rate={salaryCommissionExpenseRate} result={baseExpense} />)
  const { netAmount: netExpense, netAmountOverLimit: expenseOverLimit } = clampLimit(remainingExpenseLimit, baseExpense)
  expenseAmountExplanation.push(<ExplainLimit key="3" topic={salaryCommissionSharedExpenseRemainingText} limitAmount={remainingExpenseLimit} amountOverLimit={expenseOverLimit} />)
  expenseAmountExplanation.push(<ExplainNetExpense key="4" amount={netExpense} />)
  return {
    incomeAmount: [incomeAmount, setIncomeAmount],
    withheldTaxAmount: [withheldTaxAmountRef.current, trackedWithheldTaxAmount.set],
    expenseAmount: netExpense,
    accumulatedIncomeAmount: netIncomeAmount,
    accumulatedWithheldTaxAmount: withheldTaxAmountRef.current,
    accumulatedExpenseAmount: netExpense,
    expenseAmountExplanation,
  }
}

export function useCommissionSection({incomeState,accumulatedIncomeAmount,accumulatedWithheldTaxAmount,accumulatedExpenseAmount}: CommissionSetup): SalaryState{
  const { commissionIncome, salaryExpenseRef } = incomeState
  const [incomeAmount, setIncomeAmount] = commissionIncome
  const trackedWithheldTaxAmount = useTrackedState<Decimal>(new Decimal(0))

  const withheldTaxAmountRef = useRef<Decimal>(new Decimal(0))
  if (trackedWithheldTaxAmount.isModified)
    withheldTaxAmountRef.current = trackedWithheldTaxAmount.value
  withheldTaxAmountRef.current = Decimal.min(withheldTaxAmountRef.current, incomeAmount)

  const netIncomeAmount = incomeAmount

  const expenseAmountExplanation: ReactNode[] = []

  const baseExpense = netIncomeAmount.mul(salaryCommissionExpenseRate).toDecimalPlaces(precision)
  const remainingExpenseLimit = Decimal.max(salaryCommissionExpenseLimit.minus(salaryExpenseRef.current), 0)
  expenseAmountExplanation.push(<ExplainSharedValue key="0" topic={salaryCommissionSharedExpenseText} totalAmount={salaryCommissionExpenseLimit} usedBy={[{topic: '40(1)', totalAmount: salaryExpenseRef.current}]} remainingAmount={remainingExpenseLimit} />)
  expenseAmountExplanation.push(<Divider key="1" orientation="left" />)
  expenseAmountExplanation.push(<ExplainXPercentOfYForIncome key="2" base={netIncomeAmount} rate={salaryCommissionExpenseRate} result={baseExpense} />)
  const { netAmount: netExpense, netAmountOverLimit: expenseOverLimit } = clampLimit(remainingExpenseLimit, baseExpense)
  expenseAmountExplanation.push(<ExplainLimit key="3" topic={salaryCommissionSharedExpenseRemainingText} limitAmount={remainingExpenseLimit} amountOverLimit={expenseOverLimit} />)
  expenseAmountExplanation.push(<ExplainNetExpense key="4" amount={netExpense} />)
  return {
    incomeAmount: [incomeAmount, setIncomeAmount],
    withheldTaxAmount: [withheldTaxAmountRef.current, trackedWithheldTaxAmount.set],
    expenseAmount: netExpense,
    accumulatedIncomeAmount: accumulatedIncomeAmount.plus(netIncomeAmount),
    accumulatedWithheldTaxAmount: accumulatedWithheldTaxAmount.plus(withheldTaxAmountRef.current),
    accumulatedExpenseAmount: accumulatedExpenseAmount.plus(netExpense),
    expenseAmountExplanation,
  }
}

interface Section{
  expenseLimit?: Decimal
  expenseRate: Decimal
  incomeStateRetriever: (incomeState: IncomeState) => {
    income: [Decimal, Dispatch<SetStateAction<Decimal>>]
  }
}

export const royaltyIncomeSection: Section = {
  expenseLimit: new Decimal(100000),
  expenseRate: new Decimal('0.5'),
  incomeStateRetriever({royaltyIncome}) {
    return {
      income: royaltyIncome,
    }
  },
}
export const materialsAndLaborIncomeSection: Section = {
  expenseRate: new Decimal('0.6'),
  incomeStateRetriever({materialsAndLaborIncome}) {
    return {
      income: materialsAndLaborIncome,
    }
  },
}
const expenseOverIncomeText = 'ค่าใช้จ่ายเกินรายได้'
const expenseLimitText = 'แต่ไม่เกิน'

export function useRoyaltySection({incomeSection,incomeState, accumulatedIncomeAmount,accumulatedWithheldTaxAmount,accumulatedExpenseAmount}: RoyaltySetup): RoyaltyState{
  const { income } = incomeSection.incomeStateRetriever(incomeState)
  const [incomeAmount, setIncomeAmount] = income
  const trackedWithheldTaxAmount = useTrackedState<Decimal>(new Decimal(0))
  const [useRealExpense, setUseRealExpense] = useState<boolean>(false)
  const [realExpenseAmount, setRealExpenseAmount] = useState<Decimal>(new Decimal(0))

  const withheldTaxAmountRef = useRef<Decimal>(new Decimal(0))
  if (trackedWithheldTaxAmount.isModified)
    withheldTaxAmountRef.current = trackedWithheldTaxAmount.value
  withheldTaxAmountRef.current = Decimal.min(withheldTaxAmountRef.current, incomeAmount)

  const netIncomeAmount = incomeAmount

  const expenseAmountExplanation: ReactNode[] = []

  const { baseExpense, baseExpenseNodes } = (()=>{
    if (useRealExpense){
      const expenseNodes = [<ExplainRealExpense key="0" amount={realExpenseAmount} />]
      if (realExpenseAmount.gt(netIncomeAmount)){
        expenseNodes.push(<ExplainLimit key="1" topic={expenseOverIncomeText} limitAmount={netIncomeAmount} amountOverLimit={realExpenseAmount.minus(netIncomeAmount)} />)
      }
      return {
        baseExpense: realExpenseAmount,
        baseExpenseNodes: expenseNodes,
      }
    }else{
      const baseExpense = netIncomeAmount.mul(incomeSection.expenseRate).toDecimalPlaces(precision)
      return {
        baseExpense,
        baseExpenseNodes: [<ExplainXPercentOfYForIncome key="0" base={netIncomeAmount} rate={incomeSection.expenseRate} result={baseExpense} />],
      }
    }
  })()
  expenseAmountExplanation.push(...baseExpenseNodes)
  let netExpense: Decimal
  if (incomeSection.expenseLimit){
    const { netAmount: expenseAfterLimit, netAmountOverLimit: expenseOverLimit } = clampLimit(incomeSection.expenseLimit, baseExpense)
    netExpense = expenseAfterLimit
    expenseAmountExplanation.push(<ExplainLimit key="2" topic={expenseLimitText} limitAmount={incomeSection.expenseLimit} amountOverLimit={expenseOverLimit} />)
  }
  else{
    netExpense = baseExpense
  }
  expenseAmountExplanation.push(<ExplainNetExpense key="3" amount={netExpense} />)
  return {
    incomeAmount: [incomeAmount, setIncomeAmount],
    withheldTaxAmount: [withheldTaxAmountRef.current, trackedWithheldTaxAmount.set],
    useRealExpense: [useRealExpense, setUseRealExpense],
    realExpenseAmount: [realExpenseAmount, setRealExpenseAmount],
    expenseAmount: netExpense,
    accumulatedIncomeAmount: accumulatedIncomeAmount.plus(netIncomeAmount),
    accumulatedWithheldTaxAmount: accumulatedWithheldTaxAmount.plus(withheldTaxAmountRef.current),
    accumulatedExpenseAmount: accumulatedExpenseAmount.plus(netExpense),
    expenseAmountExplanation,
  }
}

export function useYieldIncomeSection({incomeState,accumulatedIncomeAmount,accumulatedWithheldTaxAmount,accumulatedExpenseAmount}: YieldIncomeSetup): YieldIncomeState{
  const { yieldIncomeRef } = incomeState
  const [interestIncomeAmount, setInterestIncomeAmount] = useState<Decimal>(new Decimal(0))
  const trackedInterestWithheldTaxAmount = useTrackedState<Decimal>(new Decimal(0))

  const dividendYieldsRef = useTriggerableRef<DividendYieldRef[]>([])
  const { dividendYields, totalIncomeAmount, totalDividendYieldWithheldTaxAmount } = dividendYieldsRef.ref.current.reduce((acc, x) => {
    const explanation: ReactNode[] = []

    explanation.push(<p key="0">จำนวนเงินก่อนหักภาษี: {x.incomeAmount.toFixed(precision)}</p>)

    const payerIncomeTaxRate = x.payerIncomeTaxRate.div(100).toDecimalPlaces(precision + 2)
    const taxCreditAmount = x.incomeAmount.mul(payerIncomeTaxRate).div(new Decimal(1).minus(payerIncomeTaxRate)).toDecimalPlaces(precision)
    explanation.push(<p key="1">เครดิตภาษี (จำนวนเงินก่อนหักภาษี × อัตราภาษีนิติบุคคล) ÷ (100 - อัตราภาษีนิติบุคคล): ({x.incomeAmount.toFixed(precision)} × {payerIncomeTaxRate.toFixed(precision)}) ÷ (100 - {payerIncomeTaxRate.toFixed(precision)}) = +{taxCreditAmount.toFixed(precision)}</p>)

    const netIncome = x.incomeAmount.plus(taxCreditAmount)
    explanation.push(<p key="2">จำนวนเงินได้สุทธิ: {netIncome.toFixed(precision)}</p>)

    acc.totalIncomeAmount = acc.totalIncomeAmount.plus(netIncome)

    x.constrainedWithheldTaxAmount = Decimal.min(x.constrainedWithheldTaxAmount, x.incomeAmount)
    acc.dividendYields.push({
      id: x.id,
      incomeAmount: [
        x.incomeAmount,
        value => {
          x.incomeAmount = value
          dividendYieldsRef.trigger()
        },
      ],
      withheldTaxAmount: [
        x.constrainedWithheldTaxAmount,
        value => {
          x.constrainedWithheldTaxAmount = x.userInputWithheldTaxAmount = value
          dividendYieldsRef.trigger()
        },
      ],
      payerIncomeTaxRate: [
        x.payerIncomeTaxRate,
        value => {
          x.payerIncomeTaxRate = value
          dividendYieldsRef.trigger()
        },
      ],
      netIncome,
      taxCreditExplanation: explanation,
    })

    acc.totalDividendYieldWithheldTaxAmount = acc.totalDividendYieldWithheldTaxAmount.plus(x.constrainedWithheldTaxAmount)
    
    return acc
  }, {
      dividendYields: [] as DividendYield[],
      totalIncomeAmount: interestIncomeAmount,
      totalDividendYieldWithheldTaxAmount: new Decimal(0),
  })

  const interestWithheldTaxAmountRef = useRef<Decimal>(new Decimal(0))
  if (trackedInterestWithheldTaxAmount.isModified)
    interestWithheldTaxAmountRef.current = trackedInterestWithheldTaxAmount.value
  interestWithheldTaxAmountRef.current = Decimal.min(interestWithheldTaxAmountRef.current, interestIncomeAmount)
  
  yieldIncomeRef.current = totalIncomeAmount

  return {
    interestIncomeAmount: [interestIncomeAmount, setInterestIncomeAmount],
    interestWithheldTaxAmount: [interestWithheldTaxAmountRef.current, trackedInterestWithheldTaxAmount.set],
    dividendYields: {
      elements: dividendYields,
      add() {
        dividendYieldsRef.ref.current.push({
          id: crypto.randomUUID(),
          incomeAmount: new Decimal(0),
          userInputWithheldTaxAmount: new Decimal(0),
          constrainedWithheldTaxAmount: new Decimal(0),
          payerIncomeTaxRate: new Decimal(0),
        })
        dividendYieldsRef.trigger()
      },
      delete(index) {
        dividendYieldsRef.ref.current.splice(index, 1)
        dividendYieldsRef.trigger()
      },
    },
    accumulatedIncomeAmount: accumulatedIncomeAmount.plus(totalIncomeAmount),
    accumulatedWithheldTaxAmount: accumulatedWithheldTaxAmount.plus(interestWithheldTaxAmountRef.current).plus(totalDividendYieldWithheldTaxAmount),
    accumulatedExpenseAmount: accumulatedExpenseAmount,
  }
}

interface RentalKind{
  name: string
  expenseRate: Decimal
}
export const rentalKinds: RentalKind[] = [
  { name: 'ค่าเช่าบ้าน', expenseRate: new Decimal('0.3') },
  { name: 'ค่าเช่าที่ดินที่ใช้ในการเกษตรกรรม', expenseRate: new Decimal('0.2') },
  { name: 'ค่าเช่าที่ดินที่ไม่ได้ใช้ในการเกษตรกรรม', expenseRate: new Decimal('0.15') },
  { name: 'ค่าเช่ายานพาหนะ', expenseRate: new Decimal('0.3') },
  { name: 'ค่าเช่าอื่นๆ', expenseRate: new Decimal('0.1') },
]

export function useRentalSection({rentalKinds,incomeState,incomeStateRetriever,accumulatedIncomeAmount,accumulatedWithheldTaxAmount,accumulatedExpenseAmount}: RentalSetup): RentalState{
  const { incomeRef } = incomeStateRetriever(incomeState)
  const kindsRef = useTriggerableRef<RentalRef[]>(rentalKinds.map((x, i) => ({
    id: `${i}`,
    incomeAmount: new Decimal(0),
    userInputWithheldTaxAmount: new Decimal(0),
    constrainedWithheldTaxAmount: new Decimal(0),
    useRealExpense: false,
    userInputRealExpenseAmount: new Decimal(0),
    constrainedRealExpenseAmount: new Decimal(0),
  })))

  const { kinds, totalIncomeAmount, totalWithheldTaxAmount, totalExpenseAmount } = rentalKinds.reduce((acc, x, i) => {
    const kind = kindsRef.ref.current[i]
    acc.totalIncomeAmount = acc.totalIncomeAmount.plus(kind.incomeAmount)

    kind.constrainedWithheldTaxAmount = Decimal.min(kind.constrainedWithheldTaxAmount, kind.incomeAmount)
    kind.constrainedRealExpenseAmount = Decimal.min(kind.constrainedRealExpenseAmount, kind.incomeAmount)
    
    const explanation: ReactNode[] = []

    const { baseExpense, baseExpenseNodes } = (()=>{
      if (kind.useRealExpense){
        // const expenseNodes = [<ExplainRealExpense key="0" amount={x.userInputRealExpenseAmount} />]
        // if (x.userInputRealExpenseAmount.gt(x.incomeAmount)){
        //   expenseNodes.push(<ExplainLimit key="1" topic={expenseOverIncomeText} limitAmount={x.incomeAmount} amountOverLimit={x.userInputRealExpenseAmount.minus(x.incomeAmount)} />)
        // }
        const expenseNodes = [<ExplainRealExpense key="0" amount={kind.constrainedRealExpenseAmount} />]
        return {
          baseExpense: kind.constrainedRealExpenseAmount,
          baseExpenseNodes: expenseNodes,
        }
      }else{
        const baseExpense = kind.incomeAmount.mul(x.expenseRate).toDecimalPlaces(precision)
        return {
          baseExpense,
          baseExpenseNodes: [<ExplainXPercentOfYForIncome key="0" base={kind.incomeAmount} rate={x.expenseRate} result={baseExpense} />],
        }
      }
    })()
    explanation.push(...baseExpenseNodes)
    explanation.push(<ExplainNetExpense key="3" amount={baseExpense} />)

    acc.kinds.push({
      id: kind.id,
      name: x.name,
      incomeAmount: [
        kind.incomeAmount,
        value => {
          kind.incomeAmount = value
          kindsRef.trigger()
        },
      ],
      withheldTaxAmount: [
        kind.constrainedWithheldTaxAmount,
        value => {
          kind.constrainedWithheldTaxAmount = kind.userInputWithheldTaxAmount = value
          kindsRef.trigger()
        },
      ],
      useRealExpense: [
        kind.useRealExpense,
        value => {
          kind.useRealExpense = value
          kindsRef.trigger()
        },
      ],
      realExpenseAmount: [
        kind.constrainedRealExpenseAmount,
        value => {
          kind.constrainedRealExpenseAmount = kind.userInputRealExpenseAmount = value
          kindsRef.trigger()
        },
      ],
      expenseAmount: baseExpense,
      expenseExplanation: explanation,
    })

    acc.totalWithheldTaxAmount = acc.totalWithheldTaxAmount.plus(kind.constrainedWithheldTaxAmount)
    acc.totalExpenseAmount = acc.totalExpenseAmount.plus(baseExpense)

    return acc
  }, {
      kinds: [] as Rental[],
      totalIncomeAmount: new Decimal(0),
      totalWithheldTaxAmount: new Decimal(0),
      totalExpenseAmount: new Decimal(0),
  })

  incomeRef.current = totalIncomeAmount

  return {
    kinds,
    accumulatedIncomeAmount: accumulatedIncomeAmount,
    accumulatedWithheldTaxAmount: accumulatedWithheldTaxAmount.plus(totalWithheldTaxAmount),
    accumulatedExpenseAmount: accumulatedExpenseAmount.plus(totalExpenseAmount),
  }
}

export const liberalProfessionKinds: RentalKind[] = [
  { name: 'การประกอบโรคศิลปะ', expenseRate: new Decimal('0.6') },
  { name: 'วิชาชีพอิสระอื่นๆ', expenseRate: new Decimal('0.3') },
]

export function useOtherSection({incomeState,accumulatedIncomeAmount,accumulatedWithheldTaxAmount,accumulatedExpenseAmount}: YieldIncomeSetup): OtherState{
  const { otherIncome } = incomeState
  const [incomeAmount, setIncomeAmount] = otherIncome
  const trackedWithheldTaxAmount = useTrackedState<Decimal>(new Decimal(0))
  const trackedExpenseAmount = useTrackedState<Decimal>(new Decimal(0))

  const withheldTaxAmountRef = useRef<Decimal>(new Decimal(0))
  if (trackedWithheldTaxAmount.isModified)
    withheldTaxAmountRef.current = trackedWithheldTaxAmount.value
  withheldTaxAmountRef.current = Decimal.min(withheldTaxAmountRef.current, incomeAmount)

  const expenseAmountRef = useRef<Decimal>(new Decimal(0))
  if (trackedExpenseAmount.isModified)
    expenseAmountRef.current = trackedExpenseAmount.value
  expenseAmountRef.current = Decimal.min(expenseAmountRef.current, incomeAmount)

  const netIncomeAmount = incomeAmount

  return {
    incomeAmount: [incomeAmount, setIncomeAmount],
    withheldTaxAmount: [withheldTaxAmountRef.current, trackedWithheldTaxAmount.set],
    expenseAmount: [expenseAmountRef.current, trackedExpenseAmount.set],
    accumulatedIncomeAmount: accumulatedIncomeAmount.plus(netIncomeAmount),
    accumulatedWithheldTaxAmount: accumulatedWithheldTaxAmount.plus(withheldTaxAmountRef.current),
    accumulatedExpenseAmount: accumulatedExpenseAmount.plus(expenseAmountRef.current),
  }
}

const taxDeductionPerChildNormal = new Decimal(30000)
const taxDeductionForChildrenBornInOrAfter2018ForFirstChild = taxDeductionPerChildNormal
const taxDeductionForChildrenBornInOrAfter2018PerChildForSecondChildOnward = new Decimal(60000)
const taxDeductionPerParent = new Decimal(30000)
const _20YearsAgo = currentYear - 20
const _25YearsAgo = currentYear - 25

export function useFamilialTaxDeduction(): FamilialTaxDeductionState{
  interface ChildInfo {
    isFirstChild: boolean
    isEligible: boolean
  }

  const [childrenInputs, updateChildrenInputs] = useImmer<Child[]>([])
  const [numOfParentsOver60, setNumOfParentsOver60] = useState<number>(0)

  const personalTaxDeductionAmount = new Decimal(60000)

  const {childrenBornBefore2018,childrenBornInOrAfter2018,adoptedChildren} = reduce(
    from(childrenInputs).pipe(orderBy(x => x.birthYearBE)),
    (acc, x) => {
      acc.counter++

      const birthYear = convertBEToAD(x.birthYearBE)

      const isFirstChild = acc.counter === 1
      const target = (()=>{
        if (x.isAdopted)
          return acc.adoptedChildren
        else if (birthYear >= 2018)
          return acc.childrenBornInOrAfter2018
        else
          return acc.childrenBornBefore2018
      })()

      const isEligible = (()=>{
        if (!x.isIncomeWithinLimit)
          return false
        else if (x.isDeclareDisabled)
          return true
        else if (birthYear > _20YearsAgo)
          return true
        else if (birthYear > _25YearsAgo && x.isStudying)
          return true
        else
          return false
      })()

      target.push({
        isFirstChild,
        isEligible,
      })

      return acc
    },
    {
      counter: 0,
      childrenBornBefore2018: [] as ChildInfo[],
      childrenBornInOrAfter2018: [] as ChildInfo[],
      adoptedChildren: [] as ChildInfo[],
    },
  )

  const numOfChildrenBornBefore2018 = count(
    from(childrenBornBefore2018).pipe(
      filter(x => x.isEligible),
    )
  )

  const isFirstChildBornInOrAfter2018 = some(childrenBornInOrAfter2018, { predicate: x => x.isFirstChild && x.isEligible })

  const numOfChildrenAfterTheFirstBornInOrAfter2018 = count(
    from(childrenBornInOrAfter2018).pipe(
      filter(x => !x.isFirstChild && x.isEligible),
    )
  )

  const numOfEligibleAdoptedChildren = count(
    from(adoptedChildren).pipe(
      filter(x => x.isEligible),
    )
  )

  const taxDeductionForChildrenBornBefore2018 = taxDeductionPerChildNormal.mul(numOfChildrenBornBefore2018)
  const taxDeductionForChildrenBornBefore2018Explanation = generateExplanation(taxDeductionPerChildNormal, numOfChildrenBornBefore2018, taxDeductionForChildrenBornBefore2018)

  const taxDeductionForFirstChildBornInOrAfter2018 = isFirstChildBornInOrAfter2018 ? taxDeductionForChildrenBornInOrAfter2018ForFirstChild : new Decimal(0)

  const taxDeductionForChildrenAfterTheFirstBornInOrAfter2018 = taxDeductionForChildrenBornInOrAfter2018PerChildForSecondChildOnward.mul(numOfChildrenAfterTheFirstBornInOrAfter2018)
  const taxDeductionForChildrenAfterTheFirstBornInOrAfter2018Explanation = generateExplanation(taxDeductionForChildrenBornInOrAfter2018PerChildForSecondChildOnward, numOfChildrenAfterTheFirstBornInOrAfter2018, taxDeductionForChildrenAfterTheFirstBornInOrAfter2018)

  const numOfBiologicalChildren = childrenBornBefore2018.length + childrenBornInOrAfter2018.length

  const maxAdoptedChildren = 3
  const remainingAdoptedChildrenCap = Math.max(maxAdoptedChildren - numOfBiologicalChildren, 0)
  const numOfAdoptedChildren = Math.min(numOfEligibleAdoptedChildren, remainingAdoptedChildrenCap)

  const taxDeductionForAdoptedChildren = taxDeductionPerChildNormal.mul(numOfAdoptedChildren)
  const taxDeductionForAdoptedChildrenExplanation = generateExplanation(taxDeductionPerChildNormal, numOfAdoptedChildren, taxDeductionForAdoptedChildren)

  const taxDeductionForParents = taxDeductionPerParent.mul(numOfParentsOver60)
  const taxDeductionForParentsExplanation = generateExplanation(taxDeductionPerParent, numOfParentsOver60, taxDeductionForParents, 'บุพการี')

  function generateExplanation(amountPerPerson: Decimal, numOfPeople: number, netAmount: Decimal, subject: string = 'บุตร'): ReactNode[]{
    return [
      <p key="0">ค่าลดหย่อนคนละ: {amountPerPerson.toFixed(precision)}</p>,
      <p key="1">จำนวน{subject}ที่เข้าเงื่อนไข: {numOfPeople}</p>,
      <p key="2">ค่าลดหย่อนสุทธิ: {amountPerPerson.toFixed(precision)} × {numOfPeople} = <span className={netAmount.gt(0) ? green : yellow}>{netAmount.toFixed(precision)}</span></p>
    ]
  }

  return {
    personalTaxDeductionAmount,
    children: [childrenInputs, updateChildrenInputs],
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
    totalTaxDeduction: personalTaxDeductionAmount
      .plus(taxDeductionForChildrenBornBefore2018)
      .plus(taxDeductionForFirstChildBornInOrAfter2018)
      .plus(taxDeductionForChildrenAfterTheFirstBornInOrAfter2018)
      .plus(taxDeductionForAdoptedChildren)
      .plus(taxDeductionForParents)
      ,
  }
}

const retirementGroupAmountLimit = new Decimal(500000)
const nationalSavingsFundAmountLimit = new Decimal(30000)
const annuityInsuranceAmountLimit = new Decimal(200000)
const providentFundCapRate = new Decimal('0.15')
const governmentPensionFundCapRate = new Decimal('0.3')
const retirementMutualFundCapRate = new Decimal('0.3')
const annuityInsuranceCapRate = new Decimal('0.15')
const retirementGroupText = 'กลุ่มการเลี้ยงชีพหลังเกษียณ'
const retirementGroupLimitText = 'แต่ไม่เกินกลุ่มการเลี้ยงชีพหลังเกษียณคงเหลือ'

const insuranceGroupAmountLimit = new Decimal(100000)
const healthInsuranceAmountLimit = new Decimal(25000)
const healthInsuranceOfParentsAmountLimit = new Decimal(15000)
const insuranceGroupText = 'กลุ่มประกันชีวิตทั่วไป'

export function useRetirementTaxDeduction({salaryIncome,totalIncome,taxDeductionForLifeInsuranceAmount, taxDeductionForHealthInsuranceAmount}: RetirementTaxDeductionSetup): RetirementTaxDeductionState{
  const trackedTaxDeductionForProvidentFundAmount = useTrackedState<Decimal>(new Decimal(0))
  const [taxDeductionForPrivateSchoolTeacherWelfareFundAmount, setTaxDeductionForPrivateSchoolTeacherWelfareFundAmount] = useState<Decimal>(new Decimal(0))
  const trackedTaxDeductionForGovernmentPensionFundAmount = useTrackedState<Decimal>(new Decimal(0))
  const trackedTaxDeductionForRetirementMutualFundAmount = useTrackedState<Decimal>(new Decimal(0))
  const [taxDeductionForNationalSavingsFundAmount, setTaxDeductionForNationalSavingsFundAmount] = useState<Decimal>(new Decimal(0))
  const trackedTaxDeductionForAnnuityInsuranceAmount = useTrackedState<Decimal>(new Decimal(0))

  const baseTaxDeductionForProvidentFundAmountCap = salaryIncome.mul(providentFundCapRate).toDecimalPlaces(precision)
  const baseTaxDeductionForGovernmentPensionFundAmountCap = salaryIncome.mul(governmentPensionFundCapRate).toDecimalPlaces(precision)
  const baseTaxDeductionForRetirementMutualFundAmountCap = totalIncome.mul(retirementMutualFundCapRate).toDecimalPlaces(precision)
  const taxDeductionForAnnuityInsuranceAmountSelfCap = totalIncome.mul(annuityInsuranceCapRate).toDecimalPlaces(precision)

  const taxDeductionForProvidentFundAmountRef = useRef<Decimal>(new Decimal(0))
  if (trackedTaxDeductionForProvidentFundAmount.isModified)
    taxDeductionForProvidentFundAmountRef.current = trackedTaxDeductionForProvidentFundAmount.value
  taxDeductionForProvidentFundAmountRef.current = Decimal.min(taxDeductionForProvidentFundAmountRef.current, baseTaxDeductionForProvidentFundAmountCap)
  
  const taxDeductionForGovernmentPensionFundAmountRef = useRef<Decimal>(new Decimal(0))
  if (trackedTaxDeductionForGovernmentPensionFundAmount.isModified)
    taxDeductionForGovernmentPensionFundAmountRef.current = trackedTaxDeductionForGovernmentPensionFundAmount.value
  taxDeductionForGovernmentPensionFundAmountRef.current = Decimal.min(taxDeductionForGovernmentPensionFundAmountRef.current, baseTaxDeductionForGovernmentPensionFundAmountCap)
  
  const taxDeductionForRetirementMutualFundAmountRef = useRef<Decimal>(new Decimal(0))
  if (trackedTaxDeductionForRetirementMutualFundAmount.isModified)
    taxDeductionForRetirementMutualFundAmountRef.current = trackedTaxDeductionForRetirementMutualFundAmount.value
  taxDeductionForRetirementMutualFundAmountRef.current = Decimal.min(taxDeductionForRetirementMutualFundAmountRef.current, baseTaxDeductionForRetirementMutualFundAmountCap)
  
  const remainingInsuranceGroupAmountLimitFromInsurance = insuranceGroupAmountLimit
    .minus(taxDeductionForLifeInsuranceAmount)
    .minus(taxDeductionForHealthInsuranceAmount)
  const taxDeductionForAnnuityInsuranceAmountRef = useRef<Decimal>(new Decimal(0))
  if (trackedTaxDeductionForAnnuityInsuranceAmount.isModified)
    taxDeductionForAnnuityInsuranceAmountRef.current = trackedTaxDeductionForAnnuityInsuranceAmount.value
  taxDeductionForAnnuityInsuranceAmountRef.current = Decimal.min(taxDeductionForAnnuityInsuranceAmountRef.current, taxDeductionForAnnuityInsuranceAmountSelfCap.plus(remainingInsuranceGroupAmountLimitFromInsurance))
  const taxDeductionForAnnuityInsuranceAmountAllocatedToInsuranceGroup = Decimal.min(remainingInsuranceGroupAmountLimitFromInsurance, taxDeductionForAnnuityInsuranceAmountRef.current)
  const taxDeductionForAnnuityInsuranceAmountThatCountForRetirement = taxDeductionForAnnuityInsuranceAmountRef.current.minus(taxDeductionForAnnuityInsuranceAmountAllocatedToInsuranceGroup)
  // const remainingInsuranceGroupAmountLimitFinal = remainingInsuranceGroupAmountLimitFromInsurance.minus(taxDeductionForAnnuityInsuranceAmountAllocatedToInsuranceGroup)

  const usedByProvidentFund: SharedValue = {
    topic: 'กองทุนสำรองเลี้ยงชีพ',
    totalAmount: taxDeductionForProvidentFundAmountRef.current,
  }
  const usedByPrivateSchoolTeacherWelfareFund: SharedValue = {
    topic: 'กองทุนสงเคราะห์ครูโรงเรียนเอกชน',
    totalAmount: taxDeductionForPrivateSchoolTeacherWelfareFundAmount,
  }
  const usedByGovernmentPensionFund: SharedValue = {
    topic: 'กบข.',
    totalAmount: taxDeductionForGovernmentPensionFundAmountRef.current,
  }
  const usedByRetirementMutualFund: SharedValue = {
    topic: 'RMF',
    totalAmount: taxDeductionForRetirementMutualFundAmountRef.current,
  }
  const usedByNationalSavingsFund: SharedValue = {
    topic: 'กอช.',
    totalAmount: taxDeductionForNationalSavingsFundAmount,
  }
  const usedByAnnuityInsurance: SharedValue = {
    topic: 'ประกันชีวิตแบบบำนาญ',
    totalAmount: taxDeductionForAnnuityInsuranceAmountThatCountForRetirement,
  }

  const remainingRetirementGroupAmountLimitForProvidentFund = retirementGroupAmountLimit
    .minus(taxDeductionForPrivateSchoolTeacherWelfareFundAmount)
    .minus(taxDeductionForGovernmentPensionFundAmountRef.current)
    .minus(taxDeductionForRetirementMutualFundAmountRef.current)
    .minus(taxDeductionForNationalSavingsFundAmount)
    .minus(taxDeductionForAnnuityInsuranceAmountThatCountForRetirement)
  const {
    netAmount: taxDeductionForProvidentFundAmountCap,
    netAmountOverLimit: netTaxDeductionForProvidentFundAmountCapOverLimit,
  } = clampLimit(remainingRetirementGroupAmountLimitForProvidentFund, baseTaxDeductionForProvidentFundAmountCap)
  // const {
  //   netAmount: netTaxDeductionForProvidentFundAmount,
  //   netAmountOverLimit: netTaxDeductionForProvidentFundAmountOverLimit,
  // } = ClampLimit(taxDeductionForProvidentFundAmountCap, taxDeductionForProvidentFundAmount)
  const taxDeductionForProvidentFundAmountCapExplanation: ReactNode[] = [
    <ExplainSharedValue
      key="0"
      topic={retirementGroupText}
      usedBy={[
        usedByPrivateSchoolTeacherWelfareFund,
        usedByGovernmentPensionFund,
        usedByRetirementMutualFund,
        usedByNationalSavingsFund,
        usedByAnnuityInsurance,
      ]}
      totalAmount={retirementGroupAmountLimit}
      remainingAmount={remainingRetirementGroupAmountLimitForProvidentFund}
    />,
    <Divider key="1" orientation="left" />,
    <ExplainXPercentOfYForTaxDeduction key="2" base={salaryIncome} rate={providentFundCapRate} result={baseTaxDeductionForProvidentFundAmountCap} topicPrimary="กองทุนสำรองเลี้ยงชีพ" topicSecondary="เงินเดือน" />,
    <ExplainLimit key="3" topic={retirementGroupLimitText} limitAmount={remainingRetirementGroupAmountLimitForProvidentFund} amountOverLimit={netTaxDeductionForProvidentFundAmountCapOverLimit} />,
    <ExplainNetTaxDeductionCap key="4" amount={taxDeductionForProvidentFundAmountCap} />,
  ]

  const remainingRetirementGroupAmountLimitPrivateSchoolTeacherWelfareFund = retirementGroupAmountLimit
    .minus(taxDeductionForProvidentFundAmountRef.current)
    .minus(taxDeductionForGovernmentPensionFundAmountRef.current)
    .minus(taxDeductionForRetirementMutualFundAmountRef.current)
    .minus(taxDeductionForNationalSavingsFundAmount)
    .minus(taxDeductionForAnnuityInsuranceAmountThatCountForRetirement)
  const taxDeductionForPrivateSchoolTeacherWelfareFundAmountCap = remainingRetirementGroupAmountLimitPrivateSchoolTeacherWelfareFund
  // const {
  //   netAmount: netTaxDeductionForPrivateSchoolTeacherWelfareFundAmountCap,
  //   netAmountOverLimit: netTaxDeductionForPrivateSchoolTeacherWelfareFundAmountCapOverLimit,
  // } = ClampLimit(remainingRetirementGroupAmountLimitPrivateSchoolTeacherWelfareFund, taxDeductionForPrivateSchoolTeacherWelfareFundAmount)
  const taxDeductionForPrivateSchoolTeacherWelfareFundAmountCapExplanation: ReactNode[] = [
    <ExplainSharedValue
      key="0"
      topic={retirementGroupText}
      usedBy={[
        usedByProvidentFund,
        usedByGovernmentPensionFund,
        usedByRetirementMutualFund,
        usedByNationalSavingsFund,
        usedByAnnuityInsurance,
      ]}
      totalAmount={retirementGroupAmountLimit}
      remainingAmount={remainingRetirementGroupAmountLimitPrivateSchoolTeacherWelfareFund}
    />,
  ]
  
  const remainingRetirementGroupAmountLimitForGovernmentPensionFund = retirementGroupAmountLimit
    .minus(taxDeductionForProvidentFundAmountRef.current)
    .minus(taxDeductionForPrivateSchoolTeacherWelfareFundAmount)
    .minus(taxDeductionForRetirementMutualFundAmountRef.current)
    .minus(taxDeductionForNationalSavingsFundAmount)
    .minus(taxDeductionForAnnuityInsuranceAmountThatCountForRetirement)  
  const {
    netAmount: taxDeductionForGovernmentPensionFundAmountCap,
    netAmountOverLimit: netTaxDeductionForGovernmentPensionFundAmountCapOverLimit,
  } = clampLimit(remainingRetirementGroupAmountLimitForGovernmentPensionFund, baseTaxDeductionForGovernmentPensionFundAmountCap)
  // const {
  //   netAmount: netTaxDeductionForGovernmentPensionFundAmount,
  //   netAmountOverLimit: netTaxDeductionForGovernmentPensionFundAmountOverLimit,
  // } = ClampLimit(taxDeductionForGovernmentPensionFundAmountCap, taxDeductionForGovernmentPensionFundAmount)
  const taxDeductionForGovernmentPensionFundAmountCapExplanation: ReactNode[] = [
    <ExplainSharedValue
      key="0"
      topic={retirementGroupText}
      usedBy={[
        usedByProvidentFund,
        usedByPrivateSchoolTeacherWelfareFund,
        usedByRetirementMutualFund,
        usedByNationalSavingsFund,
        usedByAnnuityInsurance,
      ]}
      totalAmount={retirementGroupAmountLimit}
      remainingAmount={remainingRetirementGroupAmountLimitForGovernmentPensionFund}
    />,
    <Divider key="1" orientation="left" />,
    <ExplainXPercentOfYForTaxDeduction key="2" base={salaryIncome} rate={governmentPensionFundCapRate} result={baseTaxDeductionForGovernmentPensionFundAmountCap} topicPrimary="กบข." topicSecondary="เงินเดือน" />,
    <ExplainLimit key="3" topic={retirementGroupLimitText} limitAmount={remainingRetirementGroupAmountLimitForGovernmentPensionFund} amountOverLimit={netTaxDeductionForGovernmentPensionFundAmountCapOverLimit} />,
    <ExplainNetTaxDeductionCap key="4" amount={taxDeductionForGovernmentPensionFundAmountCap} />,
  ]
  
  const remainingRetirementGroupAmountLimitForRetirementMutualFund = retirementGroupAmountLimit
    .minus(taxDeductionForProvidentFundAmountRef.current)
    .minus(taxDeductionForPrivateSchoolTeacherWelfareFundAmount)
    .minus(taxDeductionForGovernmentPensionFundAmountRef.current)
    .minus(taxDeductionForNationalSavingsFundAmount)
    .minus(taxDeductionForAnnuityInsuranceAmountThatCountForRetirement)
  const {
    netAmount: taxDeductionForRetirementMutualFundAmountCap,
    netAmountOverLimit: taxDeductionForRetirementMutualFundAmountCapOverLimit,
  } = clampLimit(remainingRetirementGroupAmountLimitForRetirementMutualFund, baseTaxDeductionForRetirementMutualFundAmountCap)
  // const {
  //   netAmount: netTaxDeductionForRetirementMutualFundAmount,
  //   netAmountOverLimit: netTaxDeductionForRetirementMutualFundAmountOverLimit,
  // } = ClampLimit(taxDeductionForRetirementMutualFundAmountCap, taxDeductionForRetirementMutualFundAmount)
  const taxDeductionForRetirementMutualFundAmountCapExplanation: ReactNode[] = [
    <ExplainSharedValue
      key="0"
      topic={retirementGroupText}
      usedBy={[
        usedByProvidentFund,
        usedByPrivateSchoolTeacherWelfareFund,
        usedByGovernmentPensionFund,
        usedByNationalSavingsFund,
        usedByAnnuityInsurance,
      ]}
      totalAmount={retirementGroupAmountLimit}
      remainingAmount={remainingRetirementGroupAmountLimitForRetirementMutualFund}
    />,
    <Divider key="1" orientation="left" />,
    <ExplainXPercentOfYForTaxDeduction key="2" base={totalIncome} rate={retirementMutualFundCapRate} result={baseTaxDeductionForRetirementMutualFundAmountCap} topicPrimary="RMF" topicSecondary="เงินได้ที่ต้องเสียภาษี" />,
    <ExplainLimit key="3" topic={retirementGroupLimitText} limitAmount={remainingRetirementGroupAmountLimitForRetirementMutualFund} amountOverLimit={taxDeductionForRetirementMutualFundAmountCapOverLimit} />,
    <ExplainNetTaxDeductionCap key="4" amount={taxDeductionForRetirementMutualFundAmountCap} />,
  ]

  const remainingRetirementGroupAmountLimitForNationalSavingsFund = retirementGroupAmountLimit
    .minus(taxDeductionForProvidentFundAmountRef.current)
    .minus(taxDeductionForPrivateSchoolTeacherWelfareFundAmount)
    .minus(taxDeductionForGovernmentPensionFundAmountRef.current)
    .minus(taxDeductionForRetirementMutualFundAmountRef.current)
    .minus(taxDeductionForAnnuityInsuranceAmountThatCountForRetirement)
  const {
    netAmount: taxDeductionForNationalSavingsFundAmountCap,
    netAmountOverLimit: taxDeductionForNationalSavingsFundAmountCapOverLimit,
  } = clampLimit(nationalSavingsFundAmountLimit, remainingRetirementGroupAmountLimitForNationalSavingsFund)
  const taxDeductionForNationalSavingsFundAmountCapExplanation: ReactNode[] = [
    <ExplainSharedValue
      key="0"
      topic={retirementGroupText}
      usedBy={[
        usedByProvidentFund,
        usedByPrivateSchoolTeacherWelfareFund,
        usedByGovernmentPensionFund,
        usedByRetirementMutualFund,
        usedByAnnuityInsurance,
      ]}
      totalAmount={retirementGroupAmountLimit}
      remainingAmount={remainingRetirementGroupAmountLimitForNationalSavingsFund}
    />,
    <ExplainLimit key="1" topic="แต่ไม่เกินจำนวนเงินที่จ่ายให้ กอช. สูงสุด" limitAmount={nationalSavingsFundAmountLimit} amountOverLimit={taxDeductionForNationalSavingsFundAmountCapOverLimit} />,
    <ExplainNetTaxDeductionCap key="2" amount={taxDeductionForNationalSavingsFundAmountCap} />,
  ]

  // const remainingTaxDeductionForAnnuityInsuranceAmountAfterInsurance = taxDeductionForAnnuityInsuranceAmount.minus(taxDeductionForAnnuityInsuranceAmountAllocatedToInsuranceGroup)
  
  const {
    netAmount: netTaxDeductionForAnnuityInsuranceAmountCap,
    netAmountOverLimit: netTaxDeductionForAnnuityInsuranceAmountOverCap,
  } = clampLimit(annuityInsuranceAmountLimit, taxDeductionForAnnuityInsuranceAmountSelfCap)

  const remainingRetirementGroupAmountLimitForAnnuityInsurance = retirementGroupAmountLimit
    .minus(taxDeductionForProvidentFundAmountRef.current)
    .minus(taxDeductionForPrivateSchoolTeacherWelfareFundAmount)
    .minus(taxDeductionForGovernmentPensionFundAmountRef.current)
    .minus(taxDeductionForRetirementMutualFundAmountRef.current)
    .minus(taxDeductionForNationalSavingsFundAmount)
  const {
    netAmount: remainingTaxDeductionForAnnuityInsuranceAmountAfterCap,
    netAmountOverLimit: remainingTaxDeductionForAnnuityInsuranceAmountAfterCapOverLimit,
  } = clampLimit(netTaxDeductionForAnnuityInsuranceAmountCap, remainingRetirementGroupAmountLimitForAnnuityInsurance)

  const taxDeductionForAnnuityInsuranceAmountCap = remainingTaxDeductionForAnnuityInsuranceAmountAfterCap.plus(remainingInsuranceGroupAmountLimitFromInsurance)
  const taxDeductionForAnnuityInsuranceAmountCapExplanation: ReactNode[] = [
    <ExplainSharedValue
      key="0"
      topic={insuranceGroupText}
      usedBy={[
        { topic: 'ประกันชีวิตทั่วไป', totalAmount: taxDeductionForLifeInsuranceAmount },
        { topic: 'ประกันสุขภาพ', totalAmount: taxDeductionForHealthInsuranceAmount },
      ]}
      totalAmount={insuranceGroupAmountLimit}
      remainingAmount={remainingInsuranceGroupAmountLimitFromInsurance}
    />,
    // <p key="1">นำจำนวนเงินที่จ่ายให้ประกันชีวิตแบบบำนาญมาใช้สิทธิ: <span className={taxDeductionForAnnuityInsuranceAmountAllocatedToInsuranceGroup.gt(0) ? red : yellow}>-{taxDeductionForAnnuityInsuranceAmountAllocatedToInsuranceGroup.toFixed(precision)}</span></p>,
    // <p key="2">ประกันชีวิตทั่วไปคงเหลือ: <span className={remainingInsuranceGroupAmountLimitFinal.gt(0) ? green : yellow}>{remainingInsuranceGroupAmountLimitFinal.toFixed(precision)}</span></p>,
    <Divider key="1" orientation="left" />,
    <ExplainXPercentOfYForTaxDeduction key="2" base={totalIncome} rate={annuityInsuranceCapRate} result={taxDeductionForAnnuityInsuranceAmountSelfCap} topicPrimary="ประกันชีวิตแบบบำนาญ" topicSecondary="เงินได้ที่ต้องเสียภาษี" />,
    <ExplainLimit key="3" topic="แต่ไม่เกิน" limitAmount={annuityInsuranceAmountLimit} amountOverLimit={netTaxDeductionForAnnuityInsuranceAmountOverCap} />,
    <p key="4">สามารถจ่ายให้ประกันชีวิตแบบบำนาญสูงสุด: <span className={netTaxDeductionForAnnuityInsuranceAmountCap.gt(0) ? green : yellow}>{netTaxDeductionForAnnuityInsuranceAmountCap.toFixed(precision)}</span></p>,
    <Divider key="5" orientation="left" />,
    <ExplainSharedValue
      key="6"
      topic={retirementGroupText}
      usedBy={[
        usedByProvidentFund,
        usedByPrivateSchoolTeacherWelfareFund,
        usedByGovernmentPensionFund,
        usedByRetirementMutualFund,
        usedByNationalSavingsFund,
      ]}
      totalAmount={retirementGroupAmountLimit}
      remainingAmount={remainingRetirementGroupAmountLimitForAnnuityInsurance}
    />,
    <ExplainLimit key="7" topic="แต่ไม่เกิน จำนวนที่สามารถจ่ายให้ประกันชีวิตแบบบำนาญสูงสุด" limitAmount={netTaxDeductionForAnnuityInsuranceAmountCap} amountOverLimit={remainingTaxDeductionForAnnuityInsuranceAmountAfterCapOverLimit} />,
    <p key="8">ใช้สิทธิจากประกันชีวิตทั่วไปที่เหลือ: <span className={remainingInsuranceGroupAmountLimitFromInsurance.gt(0) ? green : yellow}>+{remainingInsuranceGroupAmountLimitFromInsurance.toFixed(precision)}</span></p>,
    <ExplainNetTaxDeductionCap key="9" amount={taxDeductionForAnnuityInsuranceAmountCap} />,
  ]

  return {
    // retirementGroupAmountCap,
    // retirementGroupAmountCapExplanation,
    taxDeductionForProvidentFundAmountCap,
    taxDeductionForProvidentFundAmountCapExplanation,
    taxDeductionForProvidentFundAmount: [taxDeductionForProvidentFundAmountRef.current, trackedTaxDeductionForProvidentFundAmount.set],
    taxDeductionForPrivateSchoolTeacherWelfareFundAmountCap,
    taxDeductionForPrivateSchoolTeacherWelfareFundAmountCapExplanation,
    taxDeductionForPrivateSchoolTeacherWelfareFundAmount: [taxDeductionForPrivateSchoolTeacherWelfareFundAmount, setTaxDeductionForPrivateSchoolTeacherWelfareFundAmount],
    taxDeductionForGovernmentPensionFundAmountCap,
    taxDeductionForGovernmentPensionFundAmountCapExplanation,
    taxDeductionForGovernmentPensionFundAmount: [taxDeductionForGovernmentPensionFundAmountRef.current, trackedTaxDeductionForGovernmentPensionFundAmount.set],
    taxDeductionForRetirementMutualFundAmountCap,
    taxDeductionForRetirementMutualFundAmountCapExplanation,
    taxDeductionForRetirementMutualFundAmount: [taxDeductionForRetirementMutualFundAmountRef.current, trackedTaxDeductionForRetirementMutualFundAmount.set],
    taxDeductionForNationalSavingsFundAmountCap,
    taxDeductionForNationalSavingsFundAmountCapExplanation,
    taxDeductionForNationalSavingsFundAmount: [taxDeductionForNationalSavingsFundAmount, setTaxDeductionForNationalSavingsFundAmount],
    taxDeductionForAnnuityInsuranceAmountCap,
    taxDeductionForAnnuityInsuranceAmountCapExplanation,
    taxDeductionForAnnuityInsuranceAmount: [taxDeductionForAnnuityInsuranceAmountRef.current, trackedTaxDeductionForAnnuityInsuranceAmount.set],
    taxDeductionForAnnuityInsuranceAmountThatCountForInsurance: taxDeductionForAnnuityInsuranceAmountAllocatedToInsuranceGroup,
    totalTaxDeduction: taxDeductionForProvidentFundAmountRef.current
      .plus(taxDeductionForPrivateSchoolTeacherWelfareFundAmount)
      .plus(taxDeductionForGovernmentPensionFundAmountRef.current)
      .plus(taxDeductionForRetirementMutualFundAmountRef.current)
      .plus(taxDeductionForNationalSavingsFundAmount)
      .plus(taxDeductionForAnnuityInsuranceAmountRef.current)
      ,
  }
}

export function useInsuranceTaxDeduction({taxDeductionForAnnuityInsuranceAmountThatCountForInsurance}: InsuranceTaxDeductionSetup): InsuranceTaxDeductionState{
  const [taxDeductionForLifeInsuranceAmount, setTaxDeductionForLifeInsuranceAmount] = useState<Decimal>(new Decimal(0))
  const [taxDeductionForHealthInsuranceAmount, setTaxDeductionForHealthInsuranceAmount] = useState<Decimal>(new Decimal(0))
  const [taxDeductionForHealthInsuranceOfParentsAmount, setTaxDeductionForHealthInsuranceOfParentsAmount] = useState<Decimal>(new Decimal(0))

  const usedByAnnuityInsurance: SharedValue = {
    topic: 'ประกันชีวิตแบบบำนาญ',
    totalAmount: taxDeductionForAnnuityInsuranceAmountThatCountForInsurance,
  }
  const usedByLifeInsurance: SharedValue = {
    topic: 'ประกันชีวิตทั่วไป',
    totalAmount: taxDeductionForLifeInsuranceAmount,
  }
  const usedByHealthInsurance: SharedValue = {
    topic: 'ประกันสุขภาพ',
    totalAmount: taxDeductionForHealthInsuranceAmount,
  }

  const remainingInsuranceGroupAmountLimitForLifeInsurance = insuranceGroupAmountLimit
    .minus(taxDeductionForAnnuityInsuranceAmountThatCountForInsurance)
    .minus(taxDeductionForHealthInsuranceAmount)
  const taxDeductionForLifeInsuranceAmountCap = remainingInsuranceGroupAmountLimitForLifeInsurance
  const taxDeductionForLifeInsuranceAmountCapExplanation: ReactNode[] = [
    <ExplainSharedValue
      key="0"
      topic={insuranceGroupText}
      usedBy={[
        usedByAnnuityInsurance,
        usedByHealthInsurance,
      ]}
      totalAmount={insuranceGroupAmountLimit}
      remainingAmount={remainingInsuranceGroupAmountLimitForLifeInsurance}
    />,
  ]

  const remainingInsuranceGroupAmountLimitForHealthInsurance = insuranceGroupAmountLimit
    .minus(taxDeductionForAnnuityInsuranceAmountThatCountForInsurance)
    .minus(taxDeductionForLifeInsuranceAmount)
  const {
    netAmount: taxDeductionForHealthInsuranceAmountCap,
    netAmountOverLimit: taxDeductionForLifeInsuranceAmountCapOverLimit,
  } = clampLimit(healthInsuranceAmountLimit, remainingInsuranceGroupAmountLimitForHealthInsurance)
  const taxDeductionForHealthInsuranceAmountCapExplanation: ReactNode[] = [
    <ExplainSharedValue
      key="0"
      topic={insuranceGroupText}
      usedBy={[
        usedByAnnuityInsurance,
        usedByLifeInsurance,
      ]}
      totalAmount={insuranceGroupAmountLimit}
      remainingAmount={remainingInsuranceGroupAmountLimitForHealthInsurance}
    />,
    <ExplainLimit key="1" topic="แต่ไม่เกินจำนวนเงินที่จ่ายให้ ประกันสุขภาพ สูงสุด" limitAmount={healthInsuranceAmountLimit} amountOverLimit={taxDeductionForLifeInsuranceAmountCapOverLimit} />,
    <ExplainNetTaxDeductionCap key="2" amount={taxDeductionForHealthInsuranceAmountCap} />,
  ]

  const taxDeductionForHealthInsuranceOfParentsAmountCap = healthInsuranceOfParentsAmountLimit
  const taxDeductionForHealthInsuranceOfParentsAmountCapExplanation: ReactNode[] = []

  function clampLimit(limitAmount: Decimal, amount: Decimal){
    if (amount.gt(limitAmount))
    {
      return {
        netAmount: limitAmount,
        netAmountOverLimit: amount.minus(limitAmount),
      }
    }
    else
    {
      return {
        netAmount: amount,
        netAmountOverLimit: new Decimal(0),
      }
    }
  }

  return {
    taxDeductionForLifeInsuranceAmountCap,
    taxDeductionForLifeInsuranceAmountCapExplanation,
    taxDeductionForLifeInsuranceAmount: [taxDeductionForLifeInsuranceAmount, setTaxDeductionForLifeInsuranceAmount],
    taxDeductionForHealthInsuranceAmountCap,
    taxDeductionForHealthInsuranceAmountCapExplanation,
    taxDeductionForHealthInsuranceAmount: [taxDeductionForHealthInsuranceAmount, setTaxDeductionForHealthInsuranceAmount],
    taxDeductionForHealthInsuranceOfParentsAmountCap,
    taxDeductionForHealthInsuranceOfParentsAmountCapExplanation,
    taxDeductionForHealthInsuranceOfParentsAmount: [taxDeductionForHealthInsuranceOfParentsAmount, setTaxDeductionForHealthInsuranceOfParentsAmount],
    totalTaxDeduction: taxDeductionForLifeInsuranceAmount
      .plus(taxDeductionForHealthInsuranceAmount)
      .plus(taxDeductionForHealthInsuranceOfParentsAmount)
      ,
  }
}

const socialSecurityAmountLimit = new Decimal(9000)
const taxDeductionPerDisabledPeopleUnderCare = new Decimal(60000)
const housingLoanInterestAmountLimit = new Decimal(100000)
const educationalDonationCapRate = new Decimal('0.1')
const otherDonationCapRate = new Decimal('0.1')
const educationalDonationDeductionMultiplier = 2

export function useOtherTaxDeduction(): OtherTaxDeductionState{
  const [taxDeductionForSocialSecurityAmount, setTaxDeductionForSocialSecurityAmount] = useState<Decimal>(new Decimal(0))
  const [numOfDisabledPeopleUnderCare, setNumOfDisabledPeopleUnderCare] = useState<number>(0)
  const [taxDeductionForHousingLoanInterestAmount, setTaxDeductionForHousingLoanInterestAmount] = useState<Decimal>(new Decimal(0))

  const taxDeductionForDisabledPeopleUnderCare = taxDeductionPerDisabledPeopleUnderCare.mul(numOfDisabledPeopleUnderCare)
  const taxDeductionForDisabledPeopleUnderCareExplanation: ReactNode[] = generateExplanation(taxDeductionPerDisabledPeopleUnderCare, numOfDisabledPeopleUnderCare, taxDeductionForDisabledPeopleUnderCare)

  function generateExplanation(amountPerPerson: Decimal, numOfPeople: number, netAmount: Decimal, subject: string = 'บุตร'): ReactNode[]{
    return [
      <p key="0">ค่าลดหย่อนคนละ: {amountPerPerson.toFixed(precision)}</p>,
      <p key="1">จำนวน{subject}ที่เข้าเงื่อนไข: {numOfPeople}</p>,
      <p key="2">ค่าลดหย่อนสุทธิ: {amountPerPerson.toFixed(precision)} × {numOfPeople} = <span className={netAmount.gt(0) ? green : yellow}>{netAmount.toFixed(precision)}</span></p>
    ]
  }

  return {
    taxDeductionForSocialSecurityAmountCap: socialSecurityAmountLimit,
    taxDeductionForSocialSecurityAmountCapExplanation: [],
    taxDeductionForSocialSecurityAmount: [taxDeductionForSocialSecurityAmount, setTaxDeductionForSocialSecurityAmount],
    numOfDisabledPeopleUnderCare: [numOfDisabledPeopleUnderCare, setNumOfDisabledPeopleUnderCare],
    taxDeductionForDisabledPeopleUnderCare,
    taxDeductionForDisabledPeopleUnderCareExplanation,
    taxDeductionForHousingLoanInterestAmountCap: housingLoanInterestAmountLimit,
    taxDeductionForHousingLoanInterestAmountCapExplanation: [],
    taxDeductionForHousingLoanInterestAmount: [taxDeductionForHousingLoanInterestAmount, setTaxDeductionForHousingLoanInterestAmount],
    totalTaxDeduction: taxDeductionForSocialSecurityAmount
      .plus(taxDeductionForDisabledPeopleUnderCare)
      .plus(taxDeductionForHousingLoanInterestAmount)
      ,
  }
}

export function useDonation({totalIncome,totalExpense,totalTaxDeductionAmount}: DonationSetup): DonationState{
  const trackedEducationalDonationAmount = useTrackedState<Decimal>(new Decimal(0))
  const trackedOtherDonationAmount = useTrackedState<Decimal>(new Decimal(0))

  const remainingTotalTaxableIncomeForEducationalDonationBeforeClamp = totalIncome
    .minus(totalExpense)
    .minus(totalTaxDeductionAmount)
  const remainingTotalTaxableIncomeForEducationalDonation = Decimal.max(remainingTotalTaxableIncomeForEducationalDonationBeforeClamp, 0)
  const educationalDonationAmountCap = remainingTotalTaxableIncomeForEducationalDonation.mul(educationalDonationCapRate)
  const educationalDonationAmountRef = useRef<Decimal>(new Decimal(0))
  if (trackedEducationalDonationAmount.isModified)
    educationalDonationAmountRef.current = trackedEducationalDonationAmount.value
  educationalDonationAmountRef.current = Decimal.min(educationalDonationAmountRef.current, educationalDonationAmountCap)
  const taxDeductionForEducationalDonationAmount = educationalDonationAmountRef.current.mul(educationalDonationDeductionMultiplier)
  const educationalDonationCapRateDisplay = educationalDonationCapRate.mul(100).toFixed(precision)
  const educationalDonationAmountCapExplanation: ReactNode[] = [
    <p key="0">เงินได้ที่ต้องเสียภาษี: {totalIncome.toFixed(precision)}</p>,
    <p key="1">หักค่าใช้จ่าย: -{totalExpense.toFixed(precision)}</p>,
    <p key="2">หักค่าลดหย่อน: -{totalTaxDeductionAmount.toFixed(precision)}</p>,
  ]
  if (remainingTotalTaxableIncomeForEducationalDonationBeforeClamp.lessThan(0)){
    educationalDonationAmountCapExplanation.push(<p key="3">แต่ไม่ต่ำกว่า 0: +{remainingTotalTaxableIncomeForEducationalDonationBeforeClamp.abs().toFixed(precision)}</p>)
  }
  educationalDonationAmountCapExplanation.push(
    <p key="4">เงินได้สำหรับการคิดเงินบริจาค: {remainingTotalTaxableIncomeForEducationalDonation.toFixed(precision)}</p>,
    <p key="5">{educationalDonationCapRateDisplay}% ของจำนวนเงินได้สำหรับการคิดเงินบริจาค: {remainingTotalTaxableIncomeForEducationalDonation.toFixed(precision)} × {educationalDonationCapRateDisplay}% = <span className={educationalDonationAmountCap.gt(0) ? green : yellow}>{educationalDonationAmountCap.toFixed(precision)}</span></p>,
  )
  const taxDeductionForEducationalDonationAmountExplanation: ReactNode[] = [
    <p>{educationalDonationDeductionMultiplier} เท่าของจำนวนเงินบริจาค: {educationalDonationAmountRef.current.toFixed(precision)} × {educationalDonationDeductionMultiplier} = <span className={taxDeductionForEducationalDonationAmount.gt(0) ? green : yellow}>{taxDeductionForEducationalDonationAmount.toFixed(precision)}</span></p>,
  ]

  const remainingTotalTaxableIncomeForOtherDonationBeforeClamp = totalIncome
    .minus(totalExpense)
    .minus(totalTaxDeductionAmount)
    .minus(educationalDonationAmountRef.current)
  const remainingTotalTaxableIncomeForOtherDonation = Decimal.max(remainingTotalTaxableIncomeForOtherDonationBeforeClamp, 0)
  const otherDonationAmountCap = remainingTotalTaxableIncomeForOtherDonation.mul(otherDonationCapRate)
  const otherDonationAmountRef = useRef<Decimal>(new Decimal(0))
  if (trackedOtherDonationAmount.isModified)
    otherDonationAmountRef.current = trackedOtherDonationAmount.value
  otherDonationAmountRef.current = Decimal.min(otherDonationAmountRef.current, otherDonationAmountCap)
  const otherDonationCapRateDisplay = otherDonationCapRate.mul(100).toFixed(precision)
  const otherDonationAmountCapExplanation: ReactNode[] = [
    <p key="0">เงินได้ที่ต้องเสียภาษี: {totalIncome.toFixed(precision)}</p>,
    <p key="1">หักค่าใช้จ่าย: -{totalExpense.toFixed(precision)}</p>,
    <p key="2">หักค่าลดหย่อน: -{totalTaxDeductionAmount.toFixed(precision)}</p>,
    <p key="3">หักค่าเงินบริจาคเพื่อการศึกษา: -{taxDeductionForEducationalDonationAmount.toFixed(precision)}</p>,
  ]
  if (remainingTotalTaxableIncomeForOtherDonationBeforeClamp.lessThan(0)){
    otherDonationAmountCapExplanation.push(<p key="4">แต่ไม่ต่ำกว่า 0: +{remainingTotalTaxableIncomeForOtherDonationBeforeClamp.abs().toFixed(precision)}</p>)
  }
  otherDonationAmountCapExplanation.push(
    <p key="5">เงินได้สำหรับการคิดเงินบริจาค: {remainingTotalTaxableIncomeForOtherDonation.toFixed(precision)}</p>,
    <p key="6">{otherDonationCapRateDisplay}% ของจำนวนเงินได้สำหรับการคิดเงินบริจาค: {remainingTotalTaxableIncomeForOtherDonation.toFixed(precision)} × {otherDonationCapRateDisplay}% = <span className={otherDonationAmountCap.gt(0) ? green : yellow}>{otherDonationAmountCap.toFixed(precision)}</span></p>,
  )

  return {
    educationalDonationAmountCap,
    educationalDonationAmountCapExplanation,
    educationalDonationAmount: [educationalDonationAmountRef.current, trackedEducationalDonationAmount.set],
    taxDeductionForEducationalDonationAmount,
    taxDeductionForEducationalDonationAmountExplanation,
    otherDonationAmountCap,
    otherDonationAmountCapExplanation,
    otherDonationAmount: [otherDonationAmountRef.current, trackedOtherDonationAmount.set],
    totalTaxDeduction: taxDeductionForEducationalDonationAmount
      .plus(otherDonationAmountRef.current)
      ,
  }
}

const taxBrackets: TaxBracket[] = [
  { lowerBound: new Decimal(0), upperBound: new Decimal(150000), bracketAmount: new Decimal(150000), outsideBracketAmount: new Decimal(0), taxRate: new Decimal(0) },
  { lowerBound: new Decimal(150000), upperBound: new Decimal(300000), bracketAmount: new Decimal(150000), outsideBracketAmount: new Decimal(0), taxRate: new Decimal('0.05') },
  { lowerBound: new Decimal(300000), upperBound: new Decimal(500000), bracketAmount: new Decimal(200000), outsideBracketAmount: new Decimal(0), taxRate: new Decimal('0.1') },
  { lowerBound: new Decimal(500000), upperBound: new Decimal(750000), bracketAmount: new Decimal(250000), outsideBracketAmount: new Decimal(0), taxRate: new Decimal('0.15') },
  { lowerBound: new Decimal(750000), upperBound: new Decimal(1000000), bracketAmount: new Decimal(250000), outsideBracketAmount: new Decimal(0), taxRate: new Decimal('0.2') },
  { lowerBound: new Decimal(1000000), upperBound: new Decimal(2000000), bracketAmount: new Decimal(1000000), outsideBracketAmount: new Decimal(0), taxRate: new Decimal('0.25') },
  { lowerBound: new Decimal(2000000), upperBound: new Decimal(5000000), bracketAmount: new Decimal(3000000), outsideBracketAmount: new Decimal(0), taxRate: new Decimal('0.3') },
  { lowerBound: new Decimal(5000000), outsideBracketAmount: new Decimal(0), taxRate: new Decimal('0.35') },
]

export function useTaxCalculation({totalIncome,totalWithheldTaxAmount,totalExpense,totalTaxDeductionAmount}: TaxCalculationSetup): TaxCalculationState{
  const totalIncomeAmountAfterExpense = totalIncome.minus(totalExpense)
  const totalIncomeAmountAfterTaxDeduction = Decimal.max(totalIncomeAmountAfterExpense.minus(totalTaxDeductionAmount), 0)
  const {highestTaxBracketIndex,totalTaxAmount,taxAllocationByBrackets} = taxBrackets.reduce((acc, x, i) => {
    const {range, allocatedIncome, taxAmount } = (()=>{
      if (x.upperBound){
        const allocatedIncome = Decimal.min(acc.remainingIncome,x.bracketAmount!)
        const range = <span>มากกว่า {x.lowerBound.toFixed(0)} จนถึง {x.upperBound.toFixed(0)}</span>
        if (allocatedIncome.lt(x.outsideBracketAmount)){
          return {
            range,
            allocatedIncome: new Decimal(0),
            taxAmount: new Decimal(0),
          }
        }
        else{
          return {
            range,
            allocatedIncome,
            taxAmount: allocatedIncome.mul(x.taxRate),
          }
        }
      }
      else{
        const range = <span>มากกว่า {x.lowerBound.toFixed(0)} ขึ้นไป</span>
        if (acc.remainingIncome.lt(x.outsideBracketAmount)){
          return {
            range,
            allocatedIncome: new Decimal(0),
            taxAmount: new Decimal(0),
          }
        }else{
          return {
            range,
            allocatedIncome: acc.remainingIncome,
            taxAmount: acc.remainingIncome.mul(x.taxRate),
          }
        }
      }
    })()

    if (allocatedIncome.gt(0)){
      acc.highestTaxBracketIndex = i
      acc.totalTaxAmount = acc.totalTaxAmount.plus(taxAmount)
    }
    acc.remainingIncome = acc.remainingIncome.minus(allocatedIncome)

    acc.taxAllocationByBrackets.push({
      key: i,
      range,
      taxRate: x.taxRate,
      incomeAllocated: allocatedIncome,
      taxAmountAllocated: taxAmount,
    })

    return acc
  }, {
    highestTaxBracketIndex: 0,
    remainingIncome: totalIncomeAmountAfterTaxDeduction,
    totalTaxAmount: new Decimal(0),
    taxAllocationByBrackets: [] as TaxBracketDisplay[]
  })
  const totalTaxToBePaidAmount = totalTaxAmount.minus(totalWithheldTaxAmount)
  const totalTaxAmountToTotalIncome = totalIncome.eq(0) ? new Decimal(0) : totalTaxAmount.div(totalIncome)

  return {
    totalIncomeAmountAfterExpense,
    totalIncomeAmountAfterTaxDeduction,
    totalTaxAmount,
    totalTaxToBePaidAmount,
    taxAllocationByBrackets,
    highestTaxBracketIndex,
    totalTaxAmountToTotalIncome,
  }
}

interface IncomeSection{
  accumulatedIncomeAmount: Decimal
  accumulatedWithheldTaxAmount: Decimal
}

interface SingularIncome extends IncomeSection, Income{
}

interface Income{
  incomeAmount: [Decimal, Dispatch<SetStateAction<Decimal>>]
  withheldTaxAmount: [Decimal, Dispatch<Decimal>]
}

interface AccumulatedExpense{
  accumulatedExpenseAmount: Decimal
}

interface Expense extends AccumulatedExpense{
  expenseAmount: Decimal
  expenseAmountExplanation: ReactNode[]
}

interface RealOrLumpSumExpense extends Expense{
  useRealExpense: [boolean, Dispatch<SetStateAction<boolean>>]
  realExpenseAmount: [Decimal, Dispatch<SetStateAction<Decimal>>]
  expenseAmountExplanation: ReactNode[]
}

interface AccumulatedIncome extends IncomeSection, AccumulatedExpense{
}

export interface IncomeState{
  salaryIncome: [Decimal, Dispatch<SetStateAction<Decimal>>]

  commissionIncome: [Decimal, Dispatch<SetStateAction<Decimal>>]

  royaltyIncome: [Decimal, Dispatch<SetStateAction<Decimal>>]

  yieldIncomeRef: RefObject<Decimal>

  rentalIncomeRef: RefObject<Decimal>

  liberalProfessionIncomeRef: RefObject<Decimal>

  materialsAndLaborIncome: [Decimal, Dispatch<SetStateAction<Decimal>>]

  otherIncome: [Decimal, Dispatch<SetStateAction<Decimal>>]

  salaryExpenseRef: RefObject<Decimal>
  commissionExpenseRef: RefObject<Decimal>
}

interface SalarySetup {
  incomeState: IncomeState
}

export interface SalaryState extends SingularIncome, Expense{
}

interface CommissionSetup extends IncomeSetup{
  incomeState: IncomeState
}

interface IncomeSetup extends AccumulatedIncome{
}

interface RoyaltySetup extends IncomeSetup{
  incomeSection: Section
  incomeState: IncomeState
}

export interface RoyaltyState extends SingularIncome, RealOrLumpSumExpense{
}

interface DividendYield {
  id: string
  incomeAmount: [Decimal, Dispatch<Decimal>]
  withheldTaxAmount: [Decimal, Dispatch<Decimal>]
  payerIncomeTaxRate: [Decimal, Dispatch<Decimal>]
  netIncome: Decimal
  taxCreditExplanation: ReactNode[]
}

interface DividendYieldRef {
  id: string
  incomeAmount: Decimal
  userInputWithheldTaxAmount: Decimal
  constrainedWithheldTaxAmount: Decimal
  payerIncomeTaxRate: Decimal
}

interface YieldIncomeSetup extends AccumulatedIncome{
  incomeState: IncomeState
}

export interface YieldIncomeState extends IncomeSection, AccumulatedExpense{
  interestIncomeAmount: [Decimal, Dispatch<SetStateAction<Decimal>>]
  interestWithheldTaxAmount: [Decimal, Dispatch<Decimal>]
  dividendYields: { elements: DividendYield[], add: () => void, delete: (index: number) => void }
}

interface Rental {
  id: string
  name: string
  incomeAmount: [Decimal, Dispatch<Decimal>]
  withheldTaxAmount: [Decimal, Dispatch<Decimal>]
  useRealExpense: [boolean, Dispatch<boolean>]
  realExpenseAmount: [Decimal, Dispatch<Decimal>]
  expenseAmount: Decimal
  expenseExplanation: ReactNode[]
}

interface RentalRef {
  id: string
  incomeAmount: Decimal
  userInputWithheldTaxAmount: Decimal
  constrainedWithheldTaxAmount: Decimal
  useRealExpense: boolean
  userInputRealExpenseAmount: Decimal
  constrainedRealExpenseAmount: Decimal
}

interface RentalSetup extends AccumulatedIncome{
  rentalKinds: RentalKind[]
  incomeState: IncomeState
  exemptedIncomeInstructionIndex: number
  incomeStateRetriever: (incomeState: IncomeState) => {
    incomeRef: RefObject<Decimal>
  }
}

export interface RentalState extends IncomeSection, AccumulatedExpense{
  kinds: Rental[]
}

export interface OtherState extends SingularIncome, AccumulatedExpense{
  expenseAmount: [Decimal, Dispatch<Decimal>]
}

interface Child {
  id: string
  birthYearBE: number
  isAdopted: boolean
  isStudying: boolean
  isDeclareDisabled: boolean
  isIncomeWithinLimit: boolean
}

interface TaxDeduction{
  totalTaxDeduction: Decimal
}

export interface FamilialTaxDeductionState extends TaxDeduction{
  personalTaxDeductionAmount: Decimal
  children: [Child[], Updater<Child[]>]
  numOfChildrenBornBefore2018: number
  taxDeductionForChildrenBornBefore2018: Decimal
  taxDeductionForChildrenBornBefore2018Explanation: ReactNode[]
  isFirstChildBornInOrAfter2018: boolean
  taxDeductionForFirstChildBornInOrAfter2018: Decimal
  numOfChildrenAfterTheFirstBornInOrAfter2018: number
  taxDeductionForChildrenAfterTheFirstBornInOrAfter2018: Decimal
  taxDeductionForChildrenAfterTheFirstBornInOrAfter2018Explanation: ReactNode[]
  numOfAdoptedChildren: number
  taxDeductionForAdoptedChildren: Decimal
  taxDeductionForAdoptedChildrenExplanation: ReactNode[]
  numOfParentsOver60: [number, Dispatch<SetStateAction<number>>]
  taxDeductionForParents: Decimal
  taxDeductionForParentsExplanation: ReactNode[]
}

interface RetirementTaxDeductionSetup {
  salaryIncome: Decimal
  totalIncome: Decimal
  taxDeductionForLifeInsuranceAmount: Decimal
  taxDeductionForHealthInsuranceAmount: Decimal
}

export interface RetirementTaxDeductionState extends TaxDeduction{
  // retirementGroupAmountCap: Decimal
  // retirementGroupAmountCapExplanation: ReactNode[]
  taxDeductionForProvidentFundAmountCap: Decimal
  taxDeductionForProvidentFundAmountCapExplanation: ReactNode[]
  taxDeductionForProvidentFundAmount: [Decimal, Dispatch<Decimal>]
  taxDeductionForPrivateSchoolTeacherWelfareFundAmountCap: Decimal
  taxDeductionForPrivateSchoolTeacherWelfareFundAmountCapExplanation: ReactNode[]
  taxDeductionForPrivateSchoolTeacherWelfareFundAmount: [Decimal, Dispatch<Decimal>]
  taxDeductionForGovernmentPensionFundAmountCap: Decimal
  taxDeductionForGovernmentPensionFundAmountCapExplanation: ReactNode[]
  taxDeductionForGovernmentPensionFundAmount: [Decimal, Dispatch<Decimal>]
  taxDeductionForRetirementMutualFundAmountCap: Decimal
  taxDeductionForRetirementMutualFundAmountCapExplanation: ReactNode[]
  taxDeductionForRetirementMutualFundAmount: [Decimal, Dispatch<Decimal>]
  taxDeductionForNationalSavingsFundAmountCap: Decimal
  taxDeductionForNationalSavingsFundAmountCapExplanation: ReactNode[]
  taxDeductionForNationalSavingsFundAmount: [Decimal, Dispatch<Decimal>]
  taxDeductionForAnnuityInsuranceAmountCap: Decimal
  taxDeductionForAnnuityInsuranceAmountCapExplanation: ReactNode[]
  taxDeductionForAnnuityInsuranceAmount: [Decimal, Dispatch<Decimal>]
  taxDeductionForAnnuityInsuranceAmountThatCountForInsurance: Decimal
}

interface InsuranceTaxDeductionSetup {
  taxDeductionForAnnuityInsuranceAmountThatCountForInsurance: Decimal
}

export interface InsuranceTaxDeductionState extends TaxDeduction{
  taxDeductionForLifeInsuranceAmountCap: Decimal
  taxDeductionForLifeInsuranceAmountCapExplanation: ReactNode[]
  taxDeductionForLifeInsuranceAmount: [Decimal, Dispatch<SetStateAction<Decimal>>]
  taxDeductionForHealthInsuranceAmountCap: Decimal
  taxDeductionForHealthInsuranceAmountCapExplanation: ReactNode[]
  taxDeductionForHealthInsuranceAmount: [Decimal, Dispatch<SetStateAction<Decimal>>]
  taxDeductionForHealthInsuranceOfParentsAmountCap: Decimal
  taxDeductionForHealthInsuranceOfParentsAmountCapExplanation: ReactNode[]
  taxDeductionForHealthInsuranceOfParentsAmount: [Decimal, Dispatch<SetStateAction<Decimal>>]
}

export interface OtherTaxDeductionState extends TaxDeduction{
  taxDeductionForSocialSecurityAmountCap: Decimal
  taxDeductionForSocialSecurityAmountCapExplanation: ReactNode[]
  taxDeductionForSocialSecurityAmount: [Decimal, Dispatch<SetStateAction<Decimal>>]
  numOfDisabledPeopleUnderCare: [number, Dispatch<SetStateAction<number>>]
  taxDeductionForDisabledPeopleUnderCare: Decimal
  taxDeductionForDisabledPeopleUnderCareExplanation: ReactNode[]
  taxDeductionForHousingLoanInterestAmountCap: Decimal
  taxDeductionForHousingLoanInterestAmountCapExplanation: ReactNode[]
  taxDeductionForHousingLoanInterestAmount: [Decimal, Dispatch<SetStateAction<Decimal>>]
}

interface DonationSetup {
  totalIncome: Decimal
  totalExpense: Decimal
  totalTaxDeductionAmount: Decimal
}

export interface DonationState extends TaxDeduction{
  educationalDonationAmountCap: Decimal
  educationalDonationAmountCapExplanation: ReactNode[]
  educationalDonationAmount: [Decimal, Dispatch<Decimal>]
  taxDeductionForEducationalDonationAmount: Decimal
  taxDeductionForEducationalDonationAmountExplanation: ReactNode[]
  otherDonationAmountCap: Decimal
  otherDonationAmountCapExplanation: ReactNode[]
  otherDonationAmount: [Decimal, Dispatch<Decimal>]
}

interface TaxCalculationSetup {
  totalIncome: Decimal
  totalWithheldTaxAmount: Decimal
  totalExpense: Decimal
  totalTaxDeductionAmount: Decimal
}

export interface TaxCalculationState{
  totalIncomeAmountAfterExpense: Decimal
  totalIncomeAmountAfterTaxDeduction: Decimal
  totalTaxAmount: Decimal
  totalTaxToBePaidAmount: Decimal
  taxAllocationByBrackets: TaxBracketDisplay[]
  highestTaxBracketIndex: number
  totalTaxAmountToTotalIncome: Decimal
}

interface TaxBracket{
  lowerBound: Decimal
  upperBound?: Decimal
  bracketAmount?: Decimal
  outsideBracketAmount: Decimal
  taxRate: Decimal
}

export interface TaxBracketDisplay{
  key: number
  range: ReactNode
  taxRate: Decimal
  incomeAllocated: Decimal
  taxAmountAllocated: Decimal
}
