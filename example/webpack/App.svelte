<script>
  import 'swiper/swiper.min.css';
  import Time from './components/Time.svelte';
  import css from './app.module.css';
  import { success, successSmall } from './app2.module.css';
  import './app3.module.css';
</script>

<div class="overlay" />
<div class="modal">
  <section>
    <header class="active">My Modal title</header>
    <div class="body">
      <Time />
      <p class="{css.error} {css.errorMessage} large"><strong>Lorem ipsum dolor sit</strong>, amet consectetur adipisicing elit. Placeat, deserunt.</p>
      <p class="{success} {successSmall}">Lorem ipsum dolor sit, amet consectetur adipisicing elit. Placeat, deserunt. Lorem ipsum dolor sit amet. </p>
    </div>
    <footer>
      <button class="active">Ok</button>
      <button class="cancel">Cancel</button>
    </footer>
  </section>
</div>

<style module>
.overlay {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 5;
  background-color: rgba(0, 0, 0, 0.5);
}
.modal {
  position: fixed;
  top: 50%;
  left: 50%;
  z-index: 10;
  width: 400px;
  height: 80%;
  font-family: 'Helvetica Neue', Helvetica, Arial;
  background-color: #fff;
  transform: translateX(-50%) translateY(-50%);
  -webkit-font-smoothing: antialiased;
}

section {
  flex: 0 1 auto;
  flex-direction: column;
  display: flex;
  height: 100%;
}

header {
  padding: 1rem;
  font-size: 1.2rem;
  font-weight: bold;
  border-bottom: 1px solid #d9d9d9;
}

.body {
  padding: 1rem;
  flex: 1 0 0;
  min-height: 0;
  max-height: 100%;
  overflow: scroll;
  -webkit-overflow-scrolling: touch;
}

footer {
  padding: 1rem;
  text-align: right;
  border-top: 1px solid #d9d9d9;
}
button {
  padding: .5em 1em;
  min-width: 100px;
  font-size: .8rem;
  font-weight: 600;
  background: #fff;
  border: 1px solid #ccc;
  border-radius: 5px;
}
.cancel {
  background-color: #f2f2f2;
}
.active {
  font-weight: 700;
}
</style>