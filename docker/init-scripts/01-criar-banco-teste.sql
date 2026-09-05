-- Executado automaticamente pela imagem oficial do Postgres apenas na
-- PRIMEIRA inicialização do volume de dados (docker-entrypoint-initdb.d).
-- Cria um banco separado para os testes de integração, mantendo o banco
-- principal (manutencao_industrial) intocado.
CREATE DATABASE manutencao_industrial_test;
