from locust import HttpUser, task, constant_throughput


class CanUser(HttpUser):

    wait_time = constant_throughput(10)

    @task
    def can_list(self):
        self.client.get("/ops/cans")

    @task
    def can_detail(self):
        self.client.get("/ops/cans/1")
