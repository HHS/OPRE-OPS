import ApplicationContext from "./applicationContext/ApplicationContext";
import TestApplicationContext from "./applicationContext/TestApplicationContext";
import "@testing-library/jest-dom/extend-expect";

ApplicationContext.registerApplicationContext(TestApplicationContext);
