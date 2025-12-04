import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

type Screen = 
  | 'home' 
  | 'priceList' 
  | 'login' 
  | 'register' 
  | 'dashboard' 
  | 'booking' 
  | 'reviews' 
  | 'leaveReview';

interface Review {
  id: string;
  name: string;
  rating: number;
  text: string;
}

const Index = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const savedAuth = localStorage.getItem('authData');
    if (savedAuth) {
      const authData = JSON.parse(savedAuth);
      setIsLoggedIn(true);
      setUserName(authData.userName);
      setCurrentScreen('dashboard');
    }
    
    fetchBookedSlots();
  }, []);

  const fetchBookedSlots = async () => {
    try {
      const response = await fetch('https://functions.poehali.dev/df6e5e32-71b8-4ca6-83a3-6a76fde615cc');
      const data = await response.json();
      setBookedSlots(data.booked_slots || []);
    } catch (error) {
      console.error('Failed to fetch booked slots:', error);
    }
  };
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [wishes, setWishes] = useState<string>('');
  const [bookedSlots, setBookedSlots] = useState<Array<{date: string, time: string}>>([]);
  const [rating, setRating] = useState<number>(0);
  const [reviewText, setReviewText] = useState<string>('');
  const [reviews, setReviews] = useState<Review[]>([
    { id: '1', name: 'Мария', rating: 5, text: 'Прекрасный салон! Очень внимательный персонал и отличный сервис.' },
    { id: '2', name: 'Анна', rating: 5, text: 'Всегда выхожу довольная. Мастера профессионалы своего дела!' },
    { id: '3', name: 'Елена', rating: 4, text: 'Хороший салон, уютная атмосфера. Рекомендую!' }
  ]);

  const priceList = [
    { service: 'Коррекция (один ноготь)', price: '50₽' },
    { service: 'Маникюр с покрытием (маникюр+покрытие+гель лак)', price: '250₽' },
    { service: 'Наращивание (маникюр+укрепление+наращивание до 2 длины)', price: '500₽' },
    { service: 'Наращивание (маникюр+укрепление+наращивание длина 2+)', price: '700₽' },
    { service: 'Фигурки', price: '25₽' },
    { service: 'Дизайн', price: '150₽' }
  ];

  const availableTimes = ['9:00', '12:00', '15:00', '18:00', '21:00'];

  const handleLogin = (firstName: string) => {
    setIsLoggedIn(true);
    setUserName(firstName);
    setCurrentScreen('dashboard');
    
    if (rememberMe) {
      localStorage.setItem('authData', JSON.stringify({
        isLoggedIn: true,
        userName: firstName
      }));
    }
  };

  const handleRegister = (firstName: string) => {
    setIsLoggedIn(true);
    setUserName(firstName);
    setCurrentScreen('dashboard');
    
    localStorage.setItem('authData', JSON.stringify({
      isLoggedIn: true,
      userName: firstName
    }));
  };

  const handleBooking = async () => {
    if (selectedDate && selectedTime && selectedServices.length > 0) {
      const servicesText = selectedServices.join(', ');
      
      try {
        const response = await fetch('https://functions.poehali.dev/df6e5e32-71b8-4ca6-83a3-6a76fde615cc', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            client_name: userName || 'Клиент',
            client_phone: '+79991234567',
            services: servicesText,
            booking_date: selectedDate.toISOString().split('T')[0],
            booking_time: selectedTime,
            payment_method: paymentMethod,
            wishes: wishes
          })
        });
        
        if (response.ok) {
          toast.success('Вы успешно записаны!', {
            description: `${servicesText} - ${selectedDate.toLocaleDateString('ru-RU')} в ${selectedTime}`
          });
          setCurrentScreen('dashboard');
          setSelectedServices([]);
          setWishes('');
          fetchBookedSlots();
        } else {
          const error = await response.json();
          toast.error('Ошибка записи', {
            description: error.error || 'Попробуйте другое время'
          });
        }
      } catch (error) {
        toast.error('Ошибка соединения');
      }
    }
  };

  const handleServiceToggle = (service: string) => {
    setSelectedServices(prev => {
      if (prev.includes(service)) {
        return prev.filter(s => s !== service);
      }
      if (prev.length < 2) {
        return [...prev, service];
      }
      return prev;
    });
  };

  const handleSubmitReview = () => {
    if (rating > 0 && reviewText) {
      const newReview: Review = {
        id: Date.now().toString(),
        name: 'Гость',
        rating,
        text: reviewText
      };
      setReviews([newReview, ...reviews]);
      setRating(0);
      setReviewText('');
      toast.success('Мы очень рады нашим клиентам, благодарим вас за отзыв!');
      setTimeout(() => setCurrentScreen(isLoggedIn ? 'dashboard' : 'home'), 2000);
    }
  };

  const HomeScreen = () => (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 animate-fade-in">
      <div className="text-center mb-12">
        <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center shadow-lg">
          <Icon name="Sparkles" size={64} className="text-white" />
        </div>
        <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Салон красоты
        </h1>
        <p className="text-muted-foreground text-lg">Ваша красота — наша страсть</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl w-full">
        <Button 
          size="lg" 
          onClick={() => setCurrentScreen('priceList')}
          className="h-20 text-lg rounded-2xl hover:scale-105 transition-transform shadow-md"
        >
          <Icon name="FileText" className="mr-2" size={24} />
          Посмотреть прайс-лист
        </Button>
        
        <Button 
          size="lg" 
          onClick={() => setCurrentScreen('login')}
          variant="secondary"
          className="h-20 text-lg rounded-2xl hover:scale-105 transition-transform shadow-md"
        >
          <Icon name="LogIn" className="mr-2" size={24} />
          Войти в аккаунт
        </Button>
        
        <Button 
          size="lg" 
          onClick={() => isLoggedIn ? setCurrentScreen('booking') : setCurrentScreen('login')}
          className="h-20 text-lg rounded-2xl hover:scale-105 transition-transform shadow-md"
        >
          <Icon name="Calendar" className="mr-2" size={24} />
          Записаться
        </Button>
        
        <Button 
          size="lg" 
          onClick={() => setCurrentScreen('reviews')}
          variant="outline"
          className="h-20 text-lg rounded-2xl hover:scale-105 transition-transform shadow-md"
        >
          <Icon name="Star" className="mr-2" size={24} />
          Посмотреть отзывы
        </Button>
      </div>
    </div>
  );

  const PriceListScreen = () => (
    <div className="min-h-screen p-6 animate-fade-in">
      <Card className="max-w-3xl mx-auto shadow-xl rounded-3xl">
        <CardHeader className="text-center pb-6">
          <CardTitle className="text-4xl mb-2">Прайс-лист</CardTitle>
          <CardDescription className="text-base">Наши услуги и цены</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 mb-8">
            {priceList.map((item, index) => (
              <div 
                key={index} 
                className="flex justify-between items-center p-4 bg-secondary/30 rounded-xl hover:bg-secondary/50 transition-colors"
              >
                <span className="font-medium">{item.service}</span>
                <span className="text-xl font-bold text-primary">{item.price}</span>
              </div>
            ))}
          </div>
          <Button 
            onClick={() => setCurrentScreen('home')}
            className="w-full rounded-xl h-12"
            size="lg"
          >
            <Icon name="Home" className="mr-2" />
            На главную
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  const LoginScreen = () => {
    const [firstName, setFirstName] = useState('');
    
    return (
      <div className="min-h-screen flex items-center justify-center p-6 animate-fade-in">
        <Card className="w-full max-w-md shadow-xl rounded-3xl">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl">Вход в аккаунт</CardTitle>
            <CardDescription>Войдите для записи на услуги</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Имя</Label>
              <Input 
                id="firstName" 
                placeholder="Введите имя" 
                className="rounded-xl"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Фамилия</Label>
              <Input id="lastName" placeholder="Введите фамилию" className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Номер телефона</Label>
              <Input id="phone" type="tel" placeholder="+7 (999) 999-99-99" className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <Input id="password" type="password" placeholder="Введите пароль" className="rounded-xl" />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="remember" 
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
              />
              <Label htmlFor="remember" className="cursor-pointer text-sm">
                Запомнить меня
              </Label>
            </div>
            <Button onClick={() => handleLogin(firstName)} className="w-full rounded-xl h-12" size="lg">
              Войти
            </Button>
          <div className="text-center pt-4">
            <p className="text-sm text-muted-foreground mb-2">
              Нет аккаунта? Ничего страшного.
            </p>
            <Button 
              variant="link" 
              onClick={() => setCurrentScreen('register')}
              className="text-primary font-semibold"
            >
              Зарегистрироваться
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
    );
  };

  const RegisterScreen = () => {
    const [regFirstName, setRegFirstName] = useState('');
    
    return (
      <div className="min-h-screen flex items-center justify-center p-6 animate-fade-in">
        <Card className="w-full max-w-md shadow-xl rounded-3xl">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl">Регистрация</CardTitle>
            <CardDescription>Создайте аккаунт для записи</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="regFirstName">Имя</Label>
              <Input 
                id="regFirstName" 
                placeholder="Введите имя" 
                className="rounded-xl"
                value={regFirstName}
                onChange={(e) => setRegFirstName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="regLastName">Фамилия</Label>
              <Input id="regLastName" placeholder="Введите фамилию" className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="regPhone">Номер телефона</Label>
              <Input id="regPhone" type="tel" placeholder="+7 (999) 999-99-99" className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="regPassword">Придумайте пароль</Label>
              <Input id="regPassword" type="password" placeholder="Введите пароль" className="rounded-xl" />
            </div>
            <Button onClick={() => handleRegister(regFirstName)} className="w-full rounded-xl h-12" size="lg">
              Зарегистрироваться
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  };

  const DashboardScreen = () => (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 animate-fade-in">
      <div className="text-center mb-12">
        <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center shadow-lg">
          <Icon name="User" size={48} className="text-white" />
        </div>
        <h1 className="text-4xl font-bold mb-2">Добро пожаловать!</h1>
        <p className="text-muted-foreground">Выберите действие</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl w-full">
        <Button 
          size="lg" 
          onClick={() => setCurrentScreen('priceList')}
          className="h-20 text-lg rounded-2xl hover:scale-105 transition-transform shadow-md"
        >
          <Icon name="FileText" className="mr-2" size={24} />
          Посмотреть прайс-лист
        </Button>
        
        <Button 
          size="lg" 
          onClick={() => setCurrentScreen('booking')}
          className="h-20 text-lg rounded-2xl hover:scale-105 transition-transform shadow-md"
        >
          <Icon name="Calendar" className="mr-2" size={24} />
          Записаться
        </Button>
        
        <Button 
          size="lg" 
          onClick={() => setCurrentScreen('reviews')}
          variant="outline"
          className="h-20 text-lg rounded-2xl hover:scale-105 transition-transform shadow-md md:col-span-2"
        >
          <Icon name="Star" className="mr-2" size={24} />
          Посмотреть отзывы
        </Button>

        <Button 
          size="lg" 
          onClick={() => setCurrentScreen('home')}
          variant="secondary"
          className="h-14 text-base rounded-2xl hover:scale-105 transition-transform shadow-md md:col-span-2"
        >
          <Icon name="Home" className="mr-2" size={20} />
          На главную
        </Button>
      </div>
    </div>
  );

  const BookingScreen = () => (
    <div className="min-h-screen p-6 animate-fade-in">
      <Card className="max-w-3xl mx-auto shadow-xl rounded-3xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl">Запись на услугу</CardTitle>
          <CardDescription>Выберите удобные дату и время</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label className="text-lg font-semibold">Выберите услуги (до 2-х)</Label>
            <div className="space-y-2">
              {priceList.map((item, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 border rounded-xl hover:bg-accent/50 transition-colors">
                  <Checkbox 
                    id={`service-${index}`}
                    checked={selectedServices.includes(item.service)}
                    onCheckedChange={() => handleServiceToggle(item.service)}
                    disabled={selectedServices.length >= 2 && !selectedServices.includes(item.service)}
                  />
                  <Label htmlFor={`service-${index}`} className="flex-1 cursor-pointer flex justify-between">
                    <span>{item.service}</span>
                    <span className="font-bold text-primary">{item.price}</span>
                  </Label>
                </div>
              ))}
            </div>
            {selectedServices.length > 0 && (
              <p className="text-sm text-muted-foreground">
                Выбрано: {selectedServices.length} из 2
              </p>
            )}
          </div>

          {selectedServices.length > 0 && (
            <>
              <div className="flex justify-center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-2xl border shadow-sm"
                  disabled={(date) => date < new Date()}
                />
              </div>
            </>
          )}
          
          {selectedDate && (
            <>
              <div className="space-y-3">
                <Label className="text-lg font-semibold">Доступное время</Label>
                <div className="grid grid-cols-3 gap-2">
                  {availableTimes.map((time) => {
                    const isBooked = bookedSlots.some(
                      slot => slot.date === selectedDate.toISOString().split('T')[0] && slot.time === time
                    );
                    return (
                      <Button
                        key={time}
                        variant={selectedTime === time ? 'default' : 'outline'}
                        onClick={() => !isBooked && setSelectedTime(time)}
                        className={`rounded-xl ${isBooked ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={isBooked}
                      >
                        {time} {isBooked && '✕'}
                      </Button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-lg font-semibold">Способ оплаты</Label>
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                  <div className="flex items-center space-x-2 p-3 border rounded-xl hover:bg-accent/50 transition-colors">
                    <RadioGroupItem value="cash" id="cash" />
                    <Label htmlFor="cash" className="flex-1 cursor-pointer">
                      <Icon name="Wallet" className="inline mr-2" size={18} />
                      Наличные
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-xl hover:bg-accent/50 transition-colors">
                    <RadioGroupItem value="card" id="card" />
                    <Label htmlFor="card" className="flex-1 cursor-pointer">
                      <Icon name="CreditCard" className="inline mr-2" size={18} />
                      Безналичные
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <Label htmlFor="wishes" className="text-lg font-semibold">Пожелания к записи (необязательно)</Label>
                <Textarea
                  id="wishes"
                  placeholder="Напишите ваши пожелания или особые требования..."
                  value={wishes}
                  onChange={(e) => setWishes(e.target.value)}
                  className="rounded-xl min-h-[100px]"
                />
              </div>
            </>
          )}

          <Button 
            onClick={handleBooking}
            disabled={!selectedDate || !selectedTime || selectedServices.length === 0}
            className="w-full rounded-xl h-12"
            size="lg"
          >
            Записаться
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  const ReviewsScreen = () => (
    <div className="min-h-screen p-6 animate-fade-in">
      <Card className="max-w-3xl mx-auto shadow-xl rounded-3xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl">Отзывы клиентов</CardTitle>
          <CardDescription>Что говорят о нас</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="p-4 bg-secondary/30 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-lg">{review.name}</span>
                  <div className="flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Icon
                        key={i}
                        name="Star"
                        size={18}
                        className={i < review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-muted-foreground">{review.text}</p>
              </div>
            ))}
          </div>

          <Button 
            onClick={() => setCurrentScreen('leaveReview')}
            className="w-full rounded-xl h-12"
            size="lg"
          >
            <Icon name="MessageSquare" className="mr-2" />
            Оставить свой отзыв
          </Button>

          <Button 
            onClick={() => setCurrentScreen(isLoggedIn ? 'dashboard' : 'home')}
            variant="outline"
            className="w-full rounded-xl h-12"
            size="lg"
          >
            <Icon name="Home" className="mr-2" />
            На главную
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  const LeaveReviewScreen = () => (
    <div className="min-h-screen flex items-center justify-center p-6 animate-fade-in">
      <Card className="w-full max-w-md shadow-xl rounded-3xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl">Ваш отзыв</CardTitle>
          <CardDescription>Поделитесь впечатлениями</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label className="text-lg font-semibold">Оценка</Label>
            <div className="flex justify-center gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setRating(i + 1)}
                  className="transition-transform hover:scale-110"
                >
                  <Icon
                    name="Star"
                    size={36}
                    className={i < rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reviewText">Ваш отзыв</Label>
            <Textarea
              id="reviewText"
              placeholder="Расскажите о вашем опыте..."
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              className="min-h-32 rounded-xl"
            />
          </div>

          <Button 
            onClick={handleSubmitReview}
            disabled={rating === 0 || !reviewText}
            className="w-full rounded-xl h-12"
            size="lg"
          >
            Отправить отзыв
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/20">
      {currentScreen === 'home' && <HomeScreen />}
      {currentScreen === 'priceList' && <PriceListScreen />}
      {currentScreen === 'login' && <LoginScreen />}
      {currentScreen === 'register' && <RegisterScreen />}
      {currentScreen === 'dashboard' && <DashboardScreen />}
      {currentScreen === 'booking' && <BookingScreen />}
      {currentScreen === 'reviews' && <ReviewsScreen />}
      {currentScreen === 'leaveReview' && <LeaveReviewScreen />}
    </div>
  );
};

export default Index;