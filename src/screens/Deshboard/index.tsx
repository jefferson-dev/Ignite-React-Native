import React, { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage'
import { ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from 'styled-components/native';
import { useAuth } from '../../hooks/auth';

import { HighlightCard } from '../../components/HighlightCard'
import { 
  TransactionCard, 
  TransactionCardProps 
} from '../../components/TransactionCard'

import { 
  Container,
  Header,
  UserWrapper,
  UserInfo,
  Photo,
  User,
  UserGreeting,
  UserName,
  LogoutButton,
  Icon,
  HighlightCards,
  Transactions,
  Title,
  TransactionList,
  LoadContainer
} from './styles';

export interface DataListProps extends TransactionCardProps {
  id: string;
}

interface HighlightProps {
  amount: string;
  lastTransaction: string;
}
interface HighlightData {
  entries: HighlightProps
  expensives: HighlightProps,
  total: HighlightProps
}

export function Dashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [transaction, setTransaction] = useState<DataListProps[]>([]);
  const [highlightData, setHighlightData] = useState<HighlightData>(
    {} as HighlightData
  )

  const theme = useTheme();
  const { user, signOut } = useAuth();

  function getLastTransactionDate(
    collection: DataListProps[],
    type: 'positive' | 'negative',
  ) {
    const collectionFiltered = collection
    .filter(transaction => transaction.type === type);

    if (collectionFiltered.length === 0) {
      return 0;
    }

    const lastTransaction = new Date(
      Math.max.apply(Math, collectionFiltered
        .map(transaction => new Date(transaction.date).getTime())
      )
    )

    return `${lastTransaction.getDate()} de ${lastTransaction.toLocaleString(
      'pt-BR', {
        month: 'long'
      }
    )}`
  }

  async function loadTransaction() {
    const dataKey = `@gofinances:transactions_user:${user.id}`;
    const response = await AsyncStorage.getItem(dataKey);
    const transactions = response ? JSON.parse(response) : [];

    let entriesTotal = 0;
    let expensiveTotal = 0;
    
    const transactionsFormatted: DataListProps[] = transactions
    .map((item : DataListProps) => {
      if (item.type === 'positive') {
        entriesTotal += Number(item.amount)
      } else {
        expensiveTotal += Number(item.amount)
      }
      
      const amount = Number(item.amount).toLocaleString('pr-BR', {
        style: 'currency',
        currency: 'BRL'
      });
      
      const date = Intl.DateTimeFormat('pr-BR', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit'
      }).format(new Date(item.date));
      
      return {
        id: item.id,
        type: item.type,
        name: item.name,
        amount,
        category: item.category,
        date,
      }
    });
    
    setTransaction(transactionsFormatted);

    const lastTransactionEntries = getLastTransactionDate(transactions, 'positive')
    const lastTransactionExpensive = getLastTransactionDate(transactions, 'negative')

    let total = entriesTotal - expensiveTotal;
    
    setHighlightData({
      entries: {
        amount: entriesTotal.toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }),
        lastTransaction: lastTransactionEntries === 0 
          ? `Não há transações` 
          : `Última entrada dia ${lastTransactionEntries}`
      },
      expensives: {
        amount: expensiveTotal.toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }),
        lastTransaction: lastTransactionExpensive === 0 
          ? `Não há transações` 
          : `Última saída dia ${lastTransactionExpensive}`
      },
      total: {
        amount: total.toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }),
        lastTransaction: lastTransactionExpensive === 0 
          ? `Não há transações` 
          : `01 a ${lastTransactionExpensive}`
      }
    })

    setIsLoading(false)
  }

  useEffect(() => {
    loadTransaction();
  }, [])
  
  useFocusEffect(
    useCallback(() => {
      loadTransaction();
    }, [])
  )

  return (
    <Container>
      {
        isLoading ? 
        <LoadContainer>
          <ActivityIndicator 
            color={theme.colors.primary} 
            size="large"
          />
        </LoadContainer> :
        <>
          <Header>
            <UserWrapper>
              <UserInfo>
                <Photo 
                  source={{ 
                    uri: user.photo
                  }} 
                />
                <User>
                  <UserGreeting>Olá,</UserGreeting>
                  <UserName>{user.name}</UserName>
                </User>
              </UserInfo>

              <LogoutButton onPress={signOut}>
                <Icon name="power" />
              </LogoutButton>
            </UserWrapper>
          </Header>
          <HighlightCards>
            <HighlightCard
              type="up"
              title="Entradas"
              amount={highlightData.entries.amount}
              lastTransaction={highlightData.entries.lastTransaction}
            />
            <HighlightCard
              type="down"
              title="Saídas"
              amount={highlightData.expensives.amount}
              lastTransaction={highlightData.expensives.lastTransaction}
            />
            <HighlightCard
              type="total"
              title="Total"
              amount={highlightData.total.amount}
              lastTransaction={highlightData.total.lastTransaction}
            />
          </HighlightCards>

          <Transactions>
            <Title>Listagem</Title>

            <TransactionList
              data={transaction}
              keyExtractor={item => item.id}
              renderItem={({ item }) => <TransactionCard data={item}/>}
            />
          </Transactions>
        </>
      }
    </Container>
  )
}